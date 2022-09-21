const sgMail = require("@sendgrid/mail");
const { SENDGRID_API_KEY } = process.env;
sgMail.setApiKey(SENDGRID_API_KEY);
const myLogs = require("./GetLogs");

exports.sendEmail = (name, role, time) => {
  const emailMessage = {
    to: [
      "arpit@gadibaicho.com",
      "cto@gadibaicho.com",
      "arpit.set@gmail.com",
      "tech_zafar@leadinglogistic.com",
    ],
    from: "Notification@gadibaicho.com",
    templateId: "d-b487eb49dbb54895a2533340c64227e3",
    dynamic_template_data: {
      name,
      role,
      time,
    },
  };
  sgMail.send(emailMessage, (err, json) => {
    myLogs(err, json, "send_grid_mail");
    if (err) {
      console.log(err);
    } else {
    }
  });
};
