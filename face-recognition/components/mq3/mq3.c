#include "mq3.h"
#include "driver/adc.h"
#include "esp_adc/adc_oneshot.h"
// #include "esp_log.h"

static mq3_config_t mq3_cfg;

void mq3_init(const mq3_config_t *config) {
    mq3_cfg = *config;
    adc1_config_width(ADC_WIDTH_BIT_12);
    adc1_config_channel_atten(mq3_cfg.adc_channel, ADC_ATTEN_DB_11);

    // adc_oneshot_unit_init_cfg_t adc1_handle;
    // adc_oneshot_unit_init_cfg_t init_config1 = {
    //     .unit_id = ADC_UNIT_1,
    //     .ulp_mode = ADC_ULP_MODE_DISABLE,
    // };
    // ESP_ERROR_CHECK(adc_oneshot_new_unit(&init_config1, &adc1_handle));

}

int mq3_read_raw(void) {
    return adc1_get_raw(mq3_cfg.adc_channel);
}

// int mq3_read_adc_oneshot(void) {
//     adc_oneshot_unit_init_cfg_t adc1_handle;
//     adc_oneshot_unit_init_cfg_t init_config1 = {
//         .unit_id = ADC_UNIT_1,
//         .ulp_mode = ADC_ULP_MODE_DISABLE,
//     };
//     ESP_ERROR_CHECK(adc_oneshot_new_unit(&init_config1, &adc1_handle));
// }

float mq3_get_concentration_mg_per_l(float Vc, float RL, float Ro) {

    int adc_value = adc1_get_raw(mq3_cfg.adc_channel);
    float VRL = ((float)adc_value / 4095.0) * Vc;

    float Rs = ((Vc / VRL) - 1.0) * RL;

    float ratio = Rs / Ro;


    float concentration = 0.4 * powf(ratio / 5.0, -1.5);

    return concentration;
}

// int mq3_read(void){
//     int adc_raw;

//     adc_oneshot_unit_handle_t adc1_handle;
//     // adc_oneshot_unit_init_cfg_t init_config1 = {
//     //     .unit_id = ADC_UNIT_1,
//     // };
//     // ESP_ERROR_CHECK(adc_oneshot_new_unit(&init_config1, &adc1_handle));

//     adc_oneshot_chan_cfg_t config = {
//         .bitwidth = ADC_BITWIDTH_9,
//         .atten = ADC_ATTEN_DB_12,
//     };
//     ESP_ERROR_CHECK(adc_oneshot_config_channel(adc1_handle, ADC_CHANNEL_3, &config));

    
//     ESP_ERROR_CHECK(adc_oneshot_read(adc1_handle, ADC_CHANNEL_3, &adc_raw));
//     printf("alc probe raw data: %d\n", adc_raw);
    

//     ESP_ERROR_CHECK(adc_oneshot_del_unit(adc1_handle));
//     return adc_raw;
// }

int mq3_read(void) {
    int adc_raw = 0;
    adc_oneshot_unit_handle_t adc1_handle;

    // Konfiguracja jednostki ADC
    adc_oneshot_unit_init_cfg_t init_config1 = {
        .unit_id = ADC_UNIT_1,
    };
    ESP_ERROR_CHECK(adc_oneshot_new_unit(&init_config1, &adc1_handle));

    // Konfiguracja kanału ADC (użyj tego samego kanału co w mq3_cfg)
    adc_oneshot_chan_cfg_t config = {
        .bitwidth = ADC_BITWIDTH_DEFAULT,
        .atten = ADC_ATTEN_DB_12,
    };
    ESP_ERROR_CHECK(adc_oneshot_config_channel(adc1_handle, mq3_cfg.adc_channel, &config));

    // Odczyt wartości
    ESP_ERROR_CHECK(adc_oneshot_read(adc1_handle, mq3_cfg.adc_channel, &adc_raw));
    ESP_LOGI("MQ3", "MQ3 raw value: %d", adc_raw);

    // Usunięcie jednostki ADC
    ESP_ERROR_CHECK(adc_oneshot_del_unit(adc1_handle));

    return adc_raw;
}

