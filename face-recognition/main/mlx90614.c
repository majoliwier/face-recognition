#include "mlx90614.h"

static const char *TAG_MQTT = "MLX90614";

static uint8_t crc8_calculate(uint8_t *data, size_t len) {
    uint8_t crc = 0x00;
    
    while (len--) {
        crc ^= *data++;
        
        for (uint8_t i = 8; i > 0; i--) {
            if (crc & 0x80) {
                crc = (crc << 1) ^ 0x07;
            } else {
                crc = (crc << 1);
            }
        }
    }
    
    return crc;
}

static esp_err_t mlx90614_write_reg(mlx90614_t *dev, uint8_t reg, uint8_t *data) {
    esp_err_t ret;
    uint8_t crc_data[4];

    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (dev->device_addr << 1) | I2C_MASTER_WRITE, true);
    i2c_master_write_byte(cmd, reg, true);
    i2c_master_write_byte(cmd, data[0], true);
    i2c_master_write_byte(cmd, data[1], true);
    
    crc_data[0] = (dev->device_addr << 1);
    crc_data[1] = reg;
    crc_data[2] = data[0];
    crc_data[3] = data[1];
    uint8_t crc = crc8_calculate(crc_data, 4);
    
    i2c_master_write_byte(cmd, crc, true);
    i2c_master_stop(cmd);
    
    ret = i2c_master_cmd_begin(dev->i2c_port, cmd, 1000 / portTICK_PERIOD_MS);
    i2c_cmd_link_delete(cmd);
    
    return ret;
}

static esp_err_t mlx90614_read_reg(mlx90614_t *dev, uint8_t reg, uint8_t *data) {
    esp_err_t ret;
    uint8_t buf[3];
    uint8_t crc_data[5];

    i2c_cmd_handle_t cmd = i2c_cmd_link_create();
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (dev->device_addr << 1) | I2C_MASTER_WRITE, true);
    i2c_master_write_byte(cmd, reg, true);
    i2c_master_start(cmd);
    i2c_master_write_byte(cmd, (dev->device_addr << 1) | I2C_MASTER_READ, true);
    i2c_master_read_byte(cmd, &buf[0], I2C_MASTER_ACK);  // LSB
    i2c_master_read_byte(cmd, &buf[1], I2C_MASTER_ACK);  // MSB
    i2c_master_read_byte(cmd, &buf[2], I2C_MASTER_NACK); // PEC
    i2c_master_stop(cmd);
    
    ret = i2c_master_cmd_begin(dev->i2c_port, cmd, 1000 / portTICK_PERIOD_MS);
    i2c_cmd_link_delete(cmd);
    
    if (ret != ESP_OK) {
        ESP_LOGE(TAG_MQTT, "Error reading register: 0x%02x", reg);
        return ret;
    }
    
    crc_data[0] = (dev->device_addr << 1);
    crc_data[1] = reg;
    crc_data[2] = (dev->device_addr << 1) | 1;
    crc_data[3] = buf[0];
    crc_data[4] = buf[1];
    uint8_t crc = crc8_calculate(crc_data, 5);
    
    if (crc != buf[2]) {
        ESP_LOGE(TAG_MQTT, "CRC error: calc=%02x, recv=%02x", crc, buf[2]);
        return ESP_ERR_INVALID_CRC;
    }
    
    data[0] = buf[0];
    data[1] = buf[1];
    
    return ESP_OK;
}

esp_err_t mlx90614_init(mlx90614_t *dev) {
    esp_err_t ret;
    uint8_t idBuf[2];
    
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = dev->sda_pin,
        .scl_io_num = dev->scl_pin,
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master.clk_speed = 100000
    };
    
    ret = i2c_param_config(dev->i2c_port, &conf);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG_MQTT, "I2C config failed");
        return ret;
    }
    
    ret = i2c_driver_install(dev->i2c_port, I2C_MODE_MASTER, 0, 0, 0);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG_MQTT, "I2C driver install failed");
        return ret;
    }
    
    mlx90614_sleep_mode(dev, false);
    vTaskDelay(50 / portTICK_PERIOD_MS);
    
    ret = mlx90614_read_reg(dev, MLX90614_ID_NUMBER, idBuf);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG_MQTT, "Failed to read device ID");
        return ERR_DATA_BUS;
    }
    
    uint16_t id = ((uint16_t)idBuf[1] << 8) | idBuf[0];
    ESP_LOGI(TAG_MQTT, "Sensor ID: 0x%04X", id);
    
    if (id == 0) {
        ESP_LOGE(TAG_MQTT, "Invalid sensor ID");
        return ERR_IC_VERSION;
    }
    
    vTaskDelay(200 / portTICK_PERIOD_MS);
    ESP_LOGI(TAG_MQTT, "MLX90614 initialized successfully");
    
    return ESP_OK;
}

esp_err_t mlx90614_set_emissivity(mlx90614_t *dev, float calibrationValue, bool set0X0F) {
    if (calibrationValue > 1.0 || calibrationValue < 0.1) {
        ESP_LOGE(TAG_MQTT, "Invalid emissivity value: %.2f (must be between 0.1 and 1.0)", calibrationValue);
        return ESP_ERR_INVALID_ARG;
    }
    
    uint16_t emissivity = round(65535 * calibrationValue);
    ESP_LOGD(TAG_MQTT, "Setting emissivity to: 0x%04X", emissivity);
    
    uint8_t buf[2] = {0};
    esp_err_t ret;
    
    uint16_t forEmissNew = 0;
    if (set0X0F) {
        uint16_t curE = 0;
        uint16_t forEmissOrig = 0;
        
        ret = mlx90614_read_reg(dev, MLX90614_EMISSIVITY, buf);
        if (ret != ESP_OK) return ret;
        curE = TWO_BYTES_CONCAT(buf);
        ESP_LOGD(TAG_MQTT, "Current emissivity: 0x%04X", curE);
        
        ret = mlx90614_read_reg(dev, MLX90614_FOR_EMISSIVITY, buf);
        if (ret != ESP_OK) return ret;
        forEmissOrig = TWO_BYTES_CONCAT(buf);
        
        forEmissNew = round(((float)forEmissOrig / emissivity * curE));
        ESP_LOGD(TAG_MQTT, "Calculated new FOR_EMISSIVITY value: 0x%04X", forEmissNew);
        
        if (forEmissNew  > 0x7FFF) {
            ESP_LOGE(TAG_MQTT, "Calculated FOR_EMISSIVITY value too large: 0x%04X", forEmissNew);
            return ESP_ERR_INVALID_STATE;
        }
        
        ret = mlx90614_send_command(dev, 0x60);
        if (ret != ESP_OK) return ret;
    }
    
    memset(buf, 0, sizeof(buf));
    ret = mlx90614_write_reg(dev, MLX90614_EMISSIVITY, buf);
    if (ret != ESP_OK) return ret;
    vTaskDelay(10 / portTICK_PERIOD_MS);
    
    buf[0] = (emissivity & 0x00FF);
    buf[1] = ((emissivity & 0xFF00) >> 8);
    ret = mlx90614_write_reg(dev, MLX90614_EMISSIVITY, buf);
    if (ret != ESP_OK) return ret;
    vTaskDelay(10 / portTICK_PERIOD_MS);
    
    ret = mlx90614_read_reg(dev, MLX90614_EMISSIVITY, buf);
    if (ret != ESP_OK) return ret;
    ESP_LOGD(TAG_MQTT, "Verification of emissivity: 0x%04X", TWO_BYTES_CONCAT(buf));
    
    if (set0X0F) {
        memset(buf, 0, sizeof(buf));
        ret = mlx90614_write_reg(dev, MLX90614_FOR_EMISSIVITY, buf);
        if (ret != ESP_OK) return ret;
        vTaskDelay(10 / portTICK_PERIOD_MS);
       
        buf[0] = (forEmissNew & 0x00FF);
        buf[1] = ((forEmissNew & 0xFF00) >> 8);
        ret = mlx90614_write_reg(dev, MLX90614_FOR_EMISSIVITY, buf);
        if (ret != ESP_OK) return ret;
        vTaskDelay(10 / portTICK_PERIOD_MS);
        
        ret = mlx90614_read_reg(dev, MLX90614_FOR_EMISSIVITY, buf);
        if (ret != ESP_OK) return ret;
        ESP_LOGD(TAG_MQTT, "Verification of FOR_EMISSIVITY: 0x%04X", TWO_BYTES_CONCAT(buf));
        
        ret = mlx90614_send_command(dev, 0x61);
        if (ret != ESP_OK) return ret;
    }
    
    return ESP_OK;
}

esp_err_t mlx90614_set_measured_parameters(mlx90614_t *dev, eIIRMode_t IIRMode, eFIRMode_t FIRMode) {
    uint8_t buf[2] = {0};
    esp_err_t ret;
    
    ret = mlx90614_read_reg(dev, MLX90614_CONFIG_REG1, buf);
    if (ret != ESP_OK) return ret;
    vTaskDelay(10 / portTICK_PERIOD_MS);
    
    buf[0] &= 0xF8;
    buf[1] &= 0xF8;
    ret = mlx90614_write_reg(dev, MLX90614_CONFIG_REG1, buf);
    if (ret != ESP_OK) return ret;
    vTaskDelay(10 / portTICK_PERIOD_MS);
    
    buf[0] |= IIRMode;
    buf[1] |= FIRMode;
    ret = mlx90614_write_reg(dev, MLX90614_CONFIG_REG1, buf);
    if (ret != ESP_OK) return ret;
    vTaskDelay(10 / portTICK_PERIOD_MS);
    
    return ESP_OK;
}

esp_err_t mlx90614_get_ambient_temp(mlx90614_t *dev, float *temperature) {
    uint8_t buf[2];
    esp_err_t ret;
    
    ret = mlx90614_read_reg(dev, MLX90614_TA, buf);
    if (ret != ESP_OK) return ret;
    
    uint16_t temp_raw = ((uint16_t)buf[1] << 8) | buf[0];
    *temperature = (temp_raw * 0.02) - 273.15;
    
    return ESP_OK;
}

esp_err_t mlx90614_get_object_temp(mlx90614_t *dev, float *temperature) {
    uint8_t buf[2];
    esp_err_t ret;
    
    ret = mlx90614_read_reg(dev, MLX90614_TOBJ1, buf);
    if (ret != ESP_OK) return ret;
    
    uint16_t temp_raw = ((uint16_t)buf[1] << 8) | buf[0];
    *temperature = (temp_raw * 0.02) - 273.15;
    
    return ESP_OK;
}

esp_err_t mlx90614_get_object2_temp(mlx90614_t *dev, float *temperature) {
    uint8_t buf[2];
    esp_err_t ret;
    
    ret = mlx90614_read_reg(dev, MLX90614_TOBJ2, buf);
    if (ret != ESP_OK) return ret;
    
    uint16_t temp_raw = ((uint16_t)buf[1] << 8) | buf[0];
    *temperature = (temp_raw * 0.02) - 273.15;
    
    return ESP_OK;
}

esp_err_t mlx90614_read_flags(mlx90614_t *dev, uint8_t *flags) {
    uint8_t flagBuf[2];
    esp_err_t ret;
    
    ret = mlx90614_read_reg(dev, MLX90614_FLAGS, flagBuf);
    if (ret != ESP_OK) return ret;
    
    *flags = 0;
    
    if (flagBuf[0] & (1 << 3)) {
        *flags |= 1;
        ESP_LOGD(TAG_MQTT, "Flag: Not implemented.");
    }
    
    if (!(flagBuf[0] & (1 << 4))) {
        *flags |= (1 << 1);
        ESP_LOGD(TAG_MQTT, "Flag: INIT - POR initialization routine is still ongoing. Low active.");
    }
    
    if (flagBuf[0] & (1 << 5)) {
        *flags |= (1 << 2);
        ESP_LOGD(TAG_MQTT, "Flag: EE_DEAD - EEPROM double error has occurred. High active.");
    }
    
    if (flagBuf[0] & (1 << 7)) {
        *flags |= (1 << 3);
        ESP_LOGD(TAG_MQTT, "Flag: EEBUSY - the previous write/erase EEPROM access is still in progress. High active.");
    }
    
    return ESP_OK;
}

esp_err_t mlx90614_sleep_mode(mlx90614_t *dev, bool mode) {
    esp_err_t ret = ESP_OK;
    
    if (mode) {
        i2c_cmd_handle_t cmd = i2c_cmd_link_create();
        i2c_master_start(cmd);
        i2c_master_write_byte(cmd, (dev->device_addr << 1) | I2C_MASTER_WRITE, true);
        i2c_master_write_byte(cmd, MLX90614_SLEEP_MODE, true);
        i2c_master_write_byte(cmd, MLX90614_SLEEP_MODE_PEC, true);
        i2c_master_stop(cmd);
        
        ret = i2c_master_cmd_begin(dev->i2c_port, cmd, 1000 / portTICK_PERIOD_MS);
        i2c_cmd_link_delete(cmd);
        
        if (ret != ESP_OK) {
            ESP_LOGE(TAG_MQTT, "Failed to enter sleep mode");
            return ret;
        }
        
        ESP_LOGI(TAG_MQTT, "Entered sleep mode");
    } else {
        i2c_driver_delete(dev->i2c_port);
        
        gpio_config_t io_conf = {};
        io_conf.intr_type = GPIO_INTR_DISABLE;
        io_conf.mode = GPIO_MODE_OUTPUT;
        io_conf.pin_bit_mask = (1ULL << dev->sda_pin) | (1ULL << dev->scl_pin);
        io_conf.pull_down_en = 0;
        io_conf.pull_up_en = 1;
        gpio_config(&io_conf);
        
        gpio_set_level(dev->scl_pin, 0);
        gpio_set_level(dev->sda_pin, 1);
        vTaskDelay(50 / portTICK_PERIOD_MS);
        gpio_set_level(dev->scl_pin, 1);
        gpio_set_level(dev->sda_pin, 0);
        vTaskDelay(50 / portTICK_PERIOD_MS);
        
        i2c_config_t conf = {
            .mode = I2C_MODE_MASTER,
            .sda_io_num = dev->sda_pin,
            .scl_io_num = dev->scl_pin,
            .sda_pullup_en = GPIO_PULLUP_ENABLE,
            .scl_pullup_en = GPIO_PULLUP_ENABLE,
            .master.clk_speed = 100000
        };
        
        ret = i2c_param_config(dev->i2c_port, &conf);
        if (ret != ESP_OK) {
            ESP_LOGE(TAG_MQTT, "I2C config failed during wake up");
            return ret;
        }
        
        ret = i2c_driver_install(dev->i2c_port, I2C_MODE_MASTER, 0, 0, 0);
        if (ret != ESP_OK) {
            ESP_LOGE(TAG_MQTT, "I2C driver install failed during wake up");
            return ret;
        }
        
        i2c_cmd_handle_t cmd = i2c_cmd_link_create();
        i2c_master_start(cmd);
        i2c_master_write_byte(cmd, (dev->device_addr << 1) | I2C_MASTER_WRITE, true);
        i2c_master_stop(cmd);
        i2c_master_cmd_begin(dev->i2c_port, cmd, 1000 / portTICK_PERIOD_MS);
        i2c_cmd_link_delete(cmd);
        
        ESP_LOGI(TAG_MQTT, "Exited sleep mode");
    }
    
    vTaskDelay(200 / portTICK_PERIOD_MS);
    return ESP_OK;
}

esp_err_t mlx90614_set_i2c_address(mlx90614_t *dev, uint8_t addr) {
    uint8_t buf[2] = {0};
    esp_err_t ret;
    
    ret = mlx90614_write_reg(dev, MLX90614_SMBUS_ADDR, buf);
    if (ret != ESP_OK) return ret;
    vTaskDelay(10 / portTICK_PERIOD_MS);
    
    buf[0] = addr;
    ret = mlx90614_write_reg(dev, MLX90614_SMBUS_ADDR, buf);
    if (ret != ESP_OK) return ret;
    vTaskDelay(10 / portTICK_PERIOD_MS);
    
    dev->device_addr = addr;
    
    return ESP_OK;
}

esp_err_t mlx90614_send_command(mlx90614_t *dev, uint8_t cmd) {
    if (cmd != 0x60 && cmd != 0x61) {
        ESP_LOGE(TAG_MQTT, "Invalid command: 0x%02X (must be 0x60 or 0x61)", cmd);
        return ESP_ERR_INVALID_ARG;
    }
    
    uint8_t crc_data[2] = {(uint8_t)(dev->device_addr << 1), cmd};
    uint8_t crc = crc8_calculate(crc_data, 2);
    
    i2c_cmd_handle_t cmd_handle = i2c_cmd_link_create();
    i2c_master_start(cmd_handle);
    i2c_master_write_byte(cmd_handle, (dev->device_addr << 1) | I2C_MASTER_WRITE, true);
    i2c_master_write_byte(cmd_handle, cmd, true);
    i2c_master_write_byte(cmd_handle, crc, true);
    i2c_master_stop(cmd_handle);
    
    esp_err_t ret = i2c_master_cmd_begin(dev->i2c_port, cmd_handle, 1000 / portTICK_PERIOD_MS);
    i2c_cmd_link_delete(cmd_handle);
    
    return ret;
}