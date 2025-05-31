#ifndef MQ3_H
#define MQ3_H

#include "driver/adc.h"
#include <math.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    adc1_channel_t adc_channel; 
    int threshold;                
} mq3_config_t;


void mq3_init(const mq3_config_t *config);


int mq3_read_raw(void);

int mq3_read(void);


bool mq3_detected(void);

float mq3_get_concentration_mg_per_l(float Vc, float RL, float Ro);


#ifdef __cplusplus
}
#endif

#endif // MQ3_H
