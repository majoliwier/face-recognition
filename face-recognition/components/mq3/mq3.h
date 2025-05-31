#ifndef MQ3_H
#define MQ3_H

#include "driver/adc.h"
#include <math.h>

typedef struct {
    adc1_channel_t adc_channel; 
    int threshold;                
} mq3_config_t;


void mq3_init(const mq3_config_t *config);

int mq3_read_raw(void);

int mq3_read(void);

float mq3_get_concentration_mg_per_l(float Vc, float RL, float Ro);

#endif // MQ3_H
