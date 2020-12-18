exports.handler = async function(context, event, callback) {
    const { DOMAIN } = context;

    twiml = new Twilio.twiml.VoiceResponse();

    twiml.play({
        loop: 1
    }, `https://${DOMAIN}/hola.mp3`);

    twiml.pause({
        length: 5
    });

    callback(null, twiml);
}