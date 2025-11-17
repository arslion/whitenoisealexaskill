// package: "ask-sdk-core"
const Alexa = require('ask-sdk-core');

// CHANGE ME: your public HTTPS audio URL:
const AUDIO_URL = 'https://<your-domain>/loop.mp3';

// We’ll rotate tokens to keep the queue valid
const freshToken = () => `token-${Date.now()}`;

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const token = freshToken();
    return handlerInput.responseBuilder
      .speak("Starting your loop. Say 'stop' anytime to end.")
      .addAudioPlayerPlayDirective(
        'REPLACE_ALL',
        AUDIO_URL,          // url
        token,              // token
        0,                  // offsetInMilliseconds
        null                // expectedPreviousToken (none on first play)
      )
      .withShouldEndSession(true) // AudioPlayer runs in the background
      .getResponse();
  },
};

const StartLoopIntentHandler = {
  canHandle(handlerInput) {
    const { requestEnvelope } = handlerInput;
    return Alexa.getRequestType(requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(requestEnvelope) === 'StartLoopIntent';
  },
  handle(handlerInput) {
    const token = freshToken();
    return handlerInput.responseBuilder
      .speak("Playing the loop.")
      .addAudioPlayerPlayDirective('REPLACE_ALL', AUDIO_URL, token, 0, null)
      .withShouldEndSession(true)
      .getResponse();
  }
};

// Re-enqueue the same stream before it ends to keep looping seamlessly
const PlaybackNearlyFinishedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackNearlyFinished';
  },
  handle(handlerInput) {
    const { requestEnvelope } = handlerInput;
    const previousToken = requestEnvelope.request.token;
    const nextToken = freshToken();
    return handlerInput.responseBuilder
      .addAudioPlayerPlayDirective(
        'ENQUEUE',
        AUDIO_URL,
        nextToken,
        0,
        previousToken
      )
      .getResponse();
  },
};

// Optional: when finished (shouldn't fire if we always enqueue), start again
const PlaybackFinishedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackFinished';
  },
  handle(handlerInput) {
    const token = freshToken();
    return handlerInput.responseBuilder
      .addAudioPlayerPlayDirective('REPLACE_ALL', AUDIO_URL, token, 0, null)
      .getResponse();
  },
};

// Handle built-in stop/pause to end playback
const StopIntentsHandler = {
  canHandle(handlerInput) {
    const reqType = Alexa.getRequestType(handlerInput.requestEnvelope);
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope) || '';
    return (reqType === 'IntentRequest' && [
      'AMAZON.StopIntent',
      'AMAZON.CancelIntent',
      'AMAZON.PauseIntent'
    ].includes(intentName));
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("Stopping.")
      .addAudioPlayerStopDirective()
      .withShouldEndSession(true)
      .getResponse();
  },
};

// Required for AudioPlayer lifecycle
const PlaybackStartedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackStarted';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  },
};

const PlaybackStoppedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackStopped';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("Say 'start' to play the loop, or 'stop' to end.")
      .reprompt("Say 'start' to play the loop.")
      .getResponse();
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    StartLoopIntentHandler,
    PlaybackNearlyFinishedHandler,
    PlaybackFinishedHandler,
    PlaybackStartedHandler,
    PlaybackStoppedHandler,
    StopIntentsHandler,
    SessionEndedRequestHandler,
    FallbackHandler
  )
  .lambda();
