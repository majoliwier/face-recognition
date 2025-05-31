#include "driver/gpio.h" // piny
#include "freertos/FreeRTOS.h" // delay
#include "freertos/task.h" //delay
#include <string.h> // printf
#include "esp_wifi.h" // wifi
#include "esp_log.h" // logi
#include "esp_event.h" // eventy

extern const char *ssid;
extern const char *pass;
extern volatile bool is_connected;

#define LED_PIN GPIO_NUM_2

static EventGroupHandle_t s_wifi_event_group;

static const char *TAGwifi;


static TaskHandle_t s_blink_task_handle;


bool wifi_is_connected();

static void led_init(void);

static void blink_task(void *pvParameter);

static void event_handler(void* arg, esp_event_base_t event_base,
    int32_t event_id, void* event_data);

void wifi_task(void *pvParameters);