#define TSF_IMPLEMENTATION
#include "TinySoundFont/tsf.h"

#include <math.h>
#include <assert.h>

#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
tsf *load_sf2(const char *filename)
{
    return tsf_load_filename(filename);
}

EMSCRIPTEN_KEEPALIVE
void init_output(tsf *f, int sample_rate)
{
    tsf_set_output(f, TSF_STEREO_UNWEAVED, sample_rate, 0);
}

EMSCRIPTEN_KEEPALIVE
void note_on(tsf *f, int chan, int key, float velocity)
{
    tsf_channel_note_on(f, chan, key, velocity);
    // printf("chan %d key %d velocity %f\n", chan, key, velocity);
}

EMSCRIPTEN_KEEPALIVE
void note_off(tsf *f, int chan, int key)
{
    tsf_channel_note_off(f, chan, key);
}

EMSCRIPTEN_KEEPALIVE
void program_change(tsf *f, int chan, int pc, int is_drum)
{
    tsf_channel_set_presetnumber(f, chan, pc, is_drum);
}

EMSCRIPTEN_KEEPALIVE
void set_channel_volume(tsf *f, int chan, float volume)
{
    tsf_channel_set_volume(f, chan, volume);
}

EMSCRIPTEN_KEEPALIVE
void render_float(tsf *f, float *buf, int samples)
{
    tsf_render_float(f, buf, samples, 0);
    // printf("render_float buf %p samples %d\n", buf, samples);
}

EMSCRIPTEN_KEEPALIVE
void render_short(tsf *f, short *buf, int samples)
{
    tsf_render_short(f, buf, samples, 0);
}

tsf *SoundFont = NULL;

// int main()
// {
//     EM_ASM({ onReady(); });
// }

#define key_min 69
#define key_max (69 + 12)

void *random_note_on(void *ptr)
{
    printf("hi\n");
    static int key_current = key_min;
    static int key_prev = -1;

    while (1)
    {
        int key = key_current;
        if (++key_current == key_max)
        {
            key_current = key_min;
        }
        key_prev = key;
        float vel = 1.0;
        int chan = 1;

        if (key_prev != 1)
        {
            note_off(SoundFont, chan, key_prev);
        }

        note_on(SoundFont, chan, key, vel);

        emscripten_sleep(300);
    }
}

// int main()
// {
//     SoundFont = load_sf2("FluidR3_GM.sf2");
//     init_output(SoundFont);

//     int major, minor;
//     alcGetIntegerv(NULL, ALC_MAJOR_VERSION, 1, &major);
//     alcGetIntegerv(NULL, ALC_MINOR_VERSION, 1, &minor);

//     assert(major == 1);

//     printf("ALC version: %i.%i\n", major, minor);
//     printf("Default device: %s\n", alcGetString(NULL, ALC_DEFAULT_DEVICE_SPECIFIER));

//     ALCdevice *device = alcOpenDevice(NULL);
//     ALCcontext *context = alcCreateContext(device, NULL);
//     alcMakeContextCurrent(context);

//     printf("OpenAL version: %s\n", alGetString(AL_VERSION));
//     printf("OpenAL vendor: %s\n", alGetString(AL_VENDOR));
//     printf("OpenAL renderer: %s\n", alGetString(AL_RENDERER));

//     ALfloat listenerPos[] = {0.0, 0.0, 1.0};
//     ALfloat listenerVel[] = {0.0, 0.0, 0.0};
//     ALfloat listenerOri[] = {0.0, 0.0, -1.0, 0.0, 1.0, 0.0};
//     ALfloat listenerGain = 0.1;

//     alListenerfv(AL_POSITION, listenerPos);
//     alListenerfv(AL_VELOCITY, listenerVel);
//     alListenerfv(AL_ORIENTATION, listenerOri);
//     alListenerf(AL_GAIN, listenerGain);

//     // prepare buffers
//     alGenBuffers(BUF_COUNT, buffers);

//     // prepare sources
//     alGenSources(1, sources);
//     assert(alIsSource(sources[0]));

//     // start note thread
//     pthread_t thread_note;
//     pthread_create(&thread_note, NULL, random_note_on, NULL);

//     // initial data
//     ALuint source = sources[0];
//     for (int i = 0; i < BUF_COUNT; i++)
//     {
//         ALuint buffer = buffers[i];
//         fill_buffer(buffer);
//     }
//     alSourceQueueBuffers(source, 2, buffers);

//     alSourcePlay(sources[0]);

//     emscripten_set_main_loop(audio_loop, 15, 0);

//     pthread_join(thread_note, NULL);
// }