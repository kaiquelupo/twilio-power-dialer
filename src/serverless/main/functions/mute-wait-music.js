exports.handler = async function(context, event, callback) {
    
    twiml = new Twilio.twiml.VoiceResponse();

    twiml.say("");
        
    callback(null, twiml);

};
