const { default: axios } = require("axios");

exports.sendSms = (mobile_number, smsMessage) => {
  var params = {
    method: "SendMessage",
    send_to: mobile_number,
    msg_type: "TEXT",
    userid: "2000115765",
    auth_scheme: "plain",
    password: "Gre@tGUPsHup4Cr!a@20!5",
    v: "1.1",
    format: "text",
    msg: smsMessage,
    mask: "GADIBZ",
    dltTemplateId: "1007318844819687428",
  };
  axios
    .get("https://enterprise.smsgupshup.com/GatewayAPI/rest", {
      params: params,
    })
    .then((result) => {})
    .catch((err) => {
      console.log(err);
    });
};
