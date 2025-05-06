static const char *TAG = "MQTT";

void mqtt_app_start(void) {
    

    ESP_LOGI(TAG, "Device MAC: %s", device_id);

    ESP_LOGI(TAG, "Device MAC: %s", device_id);
    esp_mqtt_client_config_t mqtt_cfg = {
        .broker = {
            // .address.uri = "mqtt://192.168.10.169",
            // .address.uri = "mqtt://172.20.10.8",
            .address.uri = "mqtt://broker.hivemq.com",
            // .address.uri = "mqtt://172.20.10.8",
            
            
            // .address.port = 1883,
        },
        
    };

    client = esp_mqtt_client_init(&mqtt_cfg);

    esp_mqtt_client_register_event(client, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL);

    esp_mqtt_client_start(client);
}


void mqtt_app_stop(void){
    load_email_address(user_id, sizeof(user_id));
    printf("%s", user_id);
    if (client == NULL) {
        ESP_LOGW(TAG, "MQTT client is already destroyed");
        return;
    }
    esp_err_t stop_ret = esp_mqtt_client_stop(client);
    if (stop_ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to stop MQTT client: %s", esp_err_to_name(stop_ret));
    } else {
        ESP_LOGI(TAG, "MQTT client stopped successfully");
       
    }

    esp_err_t destroy_ret = esp_mqtt_client_destroy(client);
    if (destroy_ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to destroy MQTT client: %s", esp_err_to_name(destroy_ret));
    } else {
        ESP_LOGI(TAG, "MQTT client destroyed successfully");
    }
}