#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "../components/temp/mlx90614.c"

static const char *TAG = "MLX90614_EXAMPLE";

// Konfiguracja dla czujnika MLX90614
#define I2C_PORT I2C_NUM_0
#define I2C_SDA_PIN GPIO_NUM_21
#define I2C_SCL_PIN GPIO_NUM_22
#define MLX90614_ADDRESS 0x5A  // Domyślny adres I2C dla MLX90614

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
    
    // Inicjalizacja czujnika
    ret = mlx90614_init(&sensor);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Inicjalizacja MLX90614 nie powiodła się!");
        vTaskDelete(NULL);
        return;
    }
    
    // Ustawienie współczynnika emisyjności (np. dla ludzkiej skóry ~0.98)
    ret = mlx90614_set_emissivity(&sensor, 0.98, false);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Ustawienie emisyjności nie powiodło się!");
    }
    
    // Ustawienie parametrów filtrów
    ret = mlx90614_set_measured_parameters(&sensor, IIR_FILTER_4, FIR_FILTER_64);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Ustawienie parametrów filtrów nie powiodło się!");
    }
    
    // Główna pętla zadania
    while (1) {
        // Odczyt temperatury otoczenia
        ret = mlx90614_get_ambient_temp(&sensor, &ambient_temp);
        if (ret == ESP_OK) {
            ESP_LOGI(TAG, "Temperatura otoczenia: %.2f°C", ambient_temp);
        } else {
            ESP_LOGE(TAG, "Błąd odczytu temperatury otoczenia");
        }
        
        // Odczyt temperatury obiektu
        ret = mlx90614_get_object_temp(&sensor, &object_temp);
        if (ret == ESP_OK) {
            ESP_LOGI(TAG, "Temperatura obiektu: %.2f°C", object_temp);
        } else {
            ESP_LOGE(TAG, "Błąd odczytu temperatury obiektu");
        }
        
        // Odczyt flag czujnika
        ret = mlx90614_read_flags(&sensor, &flags);
        if (ret == ESP_OK && flags != 0) {
            ESP_LOGW(TAG, "Flagi czujnika: 0x%02X", flags);
        }
        
        vTaskDelay(pdMS_TO_TICKS(1000)); // Odczyt co 1 sekundę
    }
}

void app_main(void)
{
    // Inicjalizacja NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
    
    ESP_LOGI(TAG, "ESP-IDF MLX90614 przykład");
    
    // Utworzenie zadania dla odczytu z czujnika
    xTaskCreate(mlx90614_task, "mlx90614_task", 4096, NULL, 5, NULL);
}