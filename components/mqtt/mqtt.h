#ifndef MQTT_H
#define MQTT_H
#define bad_led_pin 12


#include "mqtt_client.h"

extern esp_mqtt_client_handle_t client;

extern bool mqtt_connected;

void mqtt_app_start(void); 
void mqtt_publish(const char *topic, const char *payload); 
void mqtt_message_handler(const char *topic, const char *payload);

void mqtt_app_stop(void);

#endif  // MQTT_H