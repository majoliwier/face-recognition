#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "../components/temp/mlx90614.c"
#include "mq3.h"
#include "wifi.h"
#include "mqtt_client.h"

static const char *TAG = "MLX90614_EXAMPLE";


#define I2C_PORT I2C_NUM_0
#define I2C_SDA_PIN GPIO_NUM_21
#define I2C_SCL_PIN GPIO_NUM_22
#define MLX90614_ADDRESS 0x5A 


#define MQ3_ADC_CHANNEL ADC1_CHANNEL_6
#define MQ3_THRESHOLD 1800

esp_mqtt_client_handle_t mqtt_client = NULL;

mlx90614_t sensor = {
    .i2c_port = I2C_PORT,
    .device_addr = MLX90614_ADDRESS,
    .sda_pin = I2C_SDA_PIN,
    .scl_pin = I2C_SCL_PIN
};

void mlx90614_task(void *pvParameters)
{
    esp_err_t ret;
    float ambient_temp, object_temp;
    uint8_t flags;

    ret = mlx90614_init(&sensor);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Inicjalizacja MLX90614 nie powiodła się!");
        vTaskDelete(NULL);
        return;
    }

    mlx90614_set_emissivity(&sensor, 0.98, false);
    mlx90614_set_measured_parameters(&sensor, IIR_FILTER_4, FIR_FILTER_64);

    char msg_ambient[32];
    char msg_object[32];

    while (1) {
        if (mlx90614_get_ambient_temp(&sensor, &ambient_temp) == ESP_OK) {
            ESP_LOGI(TAG, "Temperatura otoczenia: %.2f°C", ambient_temp);
            // snprintf(msg_ambient, sizeof(msg_ambient), "%.2f", ambient_temp);
            // if (mqtt_client != NULL) {
            //     esp_mqtt_client_publish(mqtt_client, "sensor/temp_otoczenia", msg_ambient, 0, 1, 0);
            // }
        }

        if (mlx90614_get_object_temp(&sensor, &object_temp) == ESP_OK) {
            ESP_LOGI(TAG, "Temperatura obiektu: %.2f°C", object_temp);
           if (object_temp > 30.0f) {
                snprintf(msg_object, sizeof(msg_object), "%.2f", object_temp);

                if (mqtt_client != NULL) {
                    ESP_LOGI(TAG, "Wysyłanie temperatury przez MQTT: %s", msg_object);
                    esp_mqtt_client_publish(mqtt_client, "sensor/temperatura", msg_object, 0, 1, 0);
                }
            }
        }

        if (mlx90614_read_flags(&sensor, &flags) == ESP_OK && flags != 0) {
            ESP_LOGW(TAG, "Flagi czujnika: 0x%02X", flags);
        }

        vTaskDelay(pdMS_TO_TICKS(8000));
    }
}

mq3_config_t mq3 = {
    .adc_channel = MQ3_ADC_CHANNEL,
    .threshold = MQ3_THRESHOLD
};

void mq3_task(void *pvParameters)
{
    mq3_init(&mq3);


    char msg[32];
    char msg2[32];
    while (1) {
        int value = mq3_read_raw();

        ESP_LOGI("MQ3", "Poziom alkoholu: %d", value);

        snprintf(msg, sizeof(msg), "%d", value);

        float concentration = mq3_get_concentration_mg_per_l(5.0f, 10.0f, 0.38f);

        snprintf(msg2, sizeof(msg2), "%.2f", concentration);
        ESP_LOGI("MQ3", "Stężenie alkoholu: %s mg/l", msg2);
        float promille = mq3_convert_to_promille(concentration);
        ESP_LOGI("MQ3", "Stężenie alkoholu w promilach: %.2f", promille);
        snprintf(msg, sizeof(msg), "%.2f", promille);

        if (mqtt_client != NULL) {
            ESP_LOGI("Mq3", "mqtt poszło");
            esp_mqtt_client_publish(mqtt_client, "sensor/alkohol", msg, 0, 1, 0);
           
        }

        vTaskDelay(pdMS_TO_TICKS(8000));
    }
}


void mqtt_app_start(void)
{
    esp_mqtt_client_config_t mqtt_cfg = {
        .broker = {
            .address.uri = "mqtt://broker.hivemq.com",
        },
        
    };

    mqtt_client = esp_mqtt_client_init(&mqtt_cfg);
    esp_mqtt_client_start(mqtt_client);
}
void app_main(void)
{
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
    
    ESP_LOGI(TAG, "ESP-IDF MLX90614 przykład");

    xTaskCreate(&wifi_task, "wifi_task", 4096, NULL, 5, NULL);
    // :))) 
    // xTaskCreate(mlx90614_task, "mlx90614_task", 4096, NULL, 5, NULL);
    mqtt_app_start();
    xTaskCreate(mq3_task, "mq3_task", 2048, NULL, 5, NULL);
    xTaskCreate(mlx90614_task, "mlx90614_task", 4096, NULL, 5, NULL);

}

