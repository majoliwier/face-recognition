idf_component_register(SRCS "wifi.c"
                       INCLUDE_DIRS "."
                       REQUIRES driver freertos esp_wifi esp_event)
