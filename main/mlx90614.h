#ifndef MLX90614_H
#define MLX90614_H

#include "driver/i2c.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <math.h>
#include <stdio.h>
#include <string.h>

// Register addresses
#define MLX90614_TA 0x06        // Ambient temperature
#define MLX90614_TOBJ1 0x07     // Object temperature 1
#define MLX90614_TOBJ2 0x08     // Object temperature 2
#define MLX90614_EMISSIVITY 0x04 // Emissivity correction coefficient register
#define MLX90614_CONFIG_REG1 0x02 // Configuration register
#define MLX90614_SLEEP_MODE 0xFF // Sleep mode command
#define MLX90614_SLEEP_MODE_PEC 0xE8 // Sleep mode PEC
#define MLX90614_FLAGS 0xF0     // Device flags register
#define MLX90614_FOR_EMISSIVITY 0x0F // Register for emissivity calculation
#define MLX90614_ID_NUMBER 0x3C // ID number register
#define MLX90614_SMBUS_ADDR 0x2E // SMBus address register

#define NO_ERR 0
#define ERR_DATA_BUS -1
#define ERR_IC_VERSION -2

#define TWO_BYTES_CONCAT(buf) ((uint16_t)(buf[0]) | ((uint16_t)(buf[1]) << 8))

typedef enum {
    IIR_FILTER_1 = 0x00,
    IIR_FILTER_2 = 0x01,
    IIR_FILTER_4 = 0x02,
    IIR_FILTER_8 = 0x03,
    IIR_FILTER_16 = 0x04,
    IIR_FILTER_32 = 0x05,
    IIR_FILTER_64 = 0x06,
    IIR_FILTER_128 = 0x07 
} eIIRMode_t;

// FIR filter modes (coefficient selection for object temperature)
typedef enum {
    FIR_FILTER_8 = 0x00,   // B=8  (Default)
    FIR_FILTER_16 = 0x01,  // B=16
    FIR_FILTER_32 = 0x02,  // B=32
    FIR_FILTER_64 = 0x03,  // B=64
    FIR_FILTER_128 = 0x04, // B=128
    FIR_FILTER_256 = 0x05, // B=256
    FIR_FILTER_512 = 0x06, // B=512
    FIR_FILTER_1024 = 0x07 // B=1024
} eFIRMode_t;

typedef struct {
    i2c_port_t i2c_port;
    uint8_t device_addr;
    gpio_num_t sda_pin;
    gpio_num_t scl_pin;
} mlx90614_t;

/**
 * @brief Initialize MLX90614 sensor
 * @param dev Pointer to MLX90614 device descriptor
 * @return ESP_OK on success
 */
esp_err_t mlx90614_init(mlx90614_t *dev);

/**
 * @brief Set emissivity correction coefficient
 * @param dev Pointer to MLX90614 device descriptor
 * @param calibrationValue Emissivity value (0.1-1.0)
 * @param set0X0F Whether to set register 0x0F
 * @return ESP_OK on success
 */
esp_err_t mlx90614_set_emissivity(mlx90614_t *dev, float calibrationValue, bool set0X0F);

/**
 * @brief Set measurement parameters (IIR and FIR modes)
 * @param dev Pointer to MLX90614 device descriptor
 * @param IIRMode IIR filter mode
 * @param FIRMode FIR filter mode
 * @return ESP_OK on success
 */
esp_err_t mlx90614_set_measured_parameters(mlx90614_t *dev, eIIRMode_t IIRMode, eFIRMode_t FIRMode);

/**
 * @brief Get ambient temperature in Celsius
 * @param dev Pointer to MLX90614 device descriptor
 * @param temperature Pointer to store temperature value
 * @return ESP_OK on success
 */
esp_err_t mlx90614_get_ambient_temp(mlx90614_t *dev, float *temperature);

/**
 * @brief Get object temperature in Celsius (from first sensor)
 * @param dev Pointer to MLX90614 device descriptor
 * @param temperature Pointer to store temperature value
 * @return ESP_OK on success
 */
esp_err_t mlx90614_get_object_temp(mlx90614_t *dev, float *temperature);

/**
 * @brief Get object temperature in Celsius (from second sensor)
 * @param dev Pointer to MLX90614 device descriptor
 * @param temperature Pointer to store temperature value
 * @return ESP_OK on success
 */
esp_err_t mlx90614_get_object2_temp(mlx90614_t *dev, float *temperature);

/**
 * @brief Read module flags
 * @param dev Pointer to MLX90614 device descriptor
 * @param flags Pointer to store flags
 * @return ESP_OK on success
 */
esp_err_t mlx90614_read_flags(mlx90614_t *dev, uint8_t *flags);

/**
 * @brief Enter or exit sleep mode
 * @param dev Pointer to MLX90614 device descriptor
 * @param mode true to enter sleep mode, false to exit
 * @return ESP_OK on success
 */
esp_err_t mlx90614_sleep_mode(mlx90614_t *dev, bool mode);

/**
 * @brief Set I2C address
 * @param dev Pointer to MLX90614 device descriptor
 * @param addr New I2C address
 * @return ESP_OK on success
 */
esp_err_t mlx90614_set_i2c_address(mlx90614_t *dev, uint8_t addr);

/**
 * @brief Send command to MLX90614
 * @param dev Pointer to MLX90614 device descriptor
 * @param cmd Command (0x60 or 0x61)
 * @return ESP_OK on success
 */
esp_err_t mlx90614_send_command(mlx90614_t *dev, uint8_t cmd);

#endif // MLX90614_H