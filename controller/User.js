
const db = require("../Helper/dbMysql");
const { DBMsgOtpStatus } = require("../Helper/dbresult");
const bcrypt = require("bcryptjs");
const { ReplaceWithEmp,RepWithSlash} = require("../Helper/utility");
const { uploadImage } = require("../Helper/UploadImage");

exports.updateUserDetails = async (req, res) => {
  const {
    email_id_v,
    first_name_v,
    last_name_v,
    father_name_v,
    sos_person_name_v,
    sos_person_mobile_number_v,
    gender_v,
    city_v,
    landmark_v,
    location_v,
    address_v,
    pin_v,
    prmnt_city_v,
    prmnt_landmark_v,
    prmnt_location_v,
    prmnt_address_v,
    prmnt_pin_v,
    blood_group_v,
    profile_picture_v,
  } = req.body;
  var imageUrl;
  let filePath = `update_user_profile/${req.ID}`;
  if (profile_picture_v != null) {
    if (profile_picture_v.length > 30) {
      imageUrl = await uploadImage(profile_picture_v, filePath);
    }
  }

  // bcrypt for hashing password------------------>
  bcrypt.hash(password_v, 10, (err, hashing) => {
    const con = db();
    con.connect(() => {});
    con.query(
      `call prc_update_users(
        '${req.ID}',
        '${email_id_v}',
        '${RepWithSlash(first_name_v)}',
       '${RepWithSlash(last_name_v)}', 
       '${RepWithSlash(father_name_v)}',
      '${RepWithSlash(sos_person_name_v)}',
      '${ReplaceWithEmp(sos_person_mobile_number_v)}',
      '${RepWithSlash(gender_v)}',
      '${RepWithSlash(city_v)}',
      '${RepWithSlash(landmark_v)}',
      '${RepWithSlash(location_v)}',
      '${RepWithSlash(address_v)}',
      '${ReplaceWithEmp(pin_v)}',
      '${RepWithSlash(prmnt_city_v)}',
      '${RepWithSlash(prmnt_landmark_v)}',
      '${RepWithSlash(prmnt_location_v)}',
      '${RepWithSlash(prmnt_address_v)}',
      '${ReplaceWithEmp(prmnt_pin_v)}',
      '${RepWithSlash(blood_group_v)}',
      '${RepWithSlash(imageUrl)}'
      )`,
      async (err, result) => {
        if (process.env.IS_LOG_REQUIRED == 1) {
          myLogs(err, result, "prc_update_users");
        }

        con.destroy();
        if (err) return res.status(404).json({ msg: "not found" });

        const { msg, otp, status } = DBMsgOtpStatus(result);

        return res.status(status).json({ msg, otp });
      }
    );
  });
};

exports.getUserProfile = async (req, res) => {
  let con = db();
  con.connect(() => {
    console.log("mysql connected");
  });
  con.query(
    `select * from latest_user_profile where user_id = '${req.ID}'`,
    async (error, result) => {
      console.log(result);
      console.log("mysql disconnected");
      con.destroy();
      if (error) return res.status(404).json({ msg: "No data found" });
      return res.status(200).json({ data: result });
    }
  );
};
