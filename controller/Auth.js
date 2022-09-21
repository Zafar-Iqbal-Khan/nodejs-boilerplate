const { body, validationResult } = require("express-validator");
const db = require("../Helper/dbMysql");
const { DBMsgOtpStatus } = require("../Helper/dbresult");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { ReplaceWithEmp,RepWithSlash } = require("../Helper/utility");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const { SESV2 } = require("aws-sdk");
const { uploadImage } = require("../Helper/UploadImage");
const { sendSms } = require("../Helper/SendSms");
require("dotenv").config();
const myLogs = require("../Helper/GetLogs");
const { sendEmail } = require("../Helper/SendMail");

exports.loginotp = async (req, res) => {
  const mobile_number = req.query.mobile_number;
  let con = db();
  con.connect(() => {
    console.log("mysql connected");
  });

  con.query(
    `call prc_generate_otp('${mobile_number}', 'LOGIN')`,
    async (error, mssg) => {
      if (process.env.IS_LOG_REQUIRED == 1) {
        myLogs(error, mssg, "prc_generate_otp");
      }
      console.log("mysql disconnected");
      con.destroy();
      if (error) return res.status(404).json({ msg: "NO Data Found" });

      const { msg, otp, status } = DBMsgOtpStatus(mssg);

      if (status == 200) {
        var otpMessage =
          "OTP is " +
          otp +
          " for your Login to GADIBIZ.COM. Valid for 1 hour.Do not share OTP for security reasons.";
        sendSms(mobile_number, otpMessage);
      }

      if (status == 200) {
        let con = db();
        con.connect(() => {
          console.log("mysql connected");
        });
        con.query(
          `select first_name, last_name from user_profile where mobile_number='${mobile_number}'`,
          (err, result) => {
            con.destroy();
            if (err) return res.status(404).json({ msg: "no user found" });

            return res.status(status).json({
              msg,
              first_name: ReplaceWithEmp(result[0].first_name),
              last_name: ReplaceWithEmp(result[0].last_name),
            });
          }
        );
      } else return res.status(status).json({ msg });
    }
  );
};

exports.loginEmailAndPassword = async (req, res) => {
  const { 
    email,
     password,
    //  ip ,
    } = req.body;

  let con = db();

  con.connect(() => {
    console.log("mysql connected");
  });
  con.query(
    `select user_id from latest_users_with_profile where email_id = '${email}'`,
    (err, result) => {
      if (err) return res.status(404).json({ msg: "error" });
      if (result.length != 0) {
        con.query(
          `select user_role_id from latest_users_with_profile where email_id = '${email}'
        `,
          (err, result) => {
            // con.destroy();
            // console.log(err);

            if (err) return res.status(404).json({ msg: "Not Found" });
            if (result[0].user_role_id == 0 || result[0].user_role_id == 1) {
              return res.status(404).json({
                msg: "You can not login with email and password. Try login with otp",
              });
            }
            const loginFunc = () => {
              con.query(
                `select user_id,(select role_name from role where role_id= (select user_role_id from latest_users_with_profile where email_id = '${email}')) as role_name, password, first_name,last_name,email_id,mobile_number,gender,city from latest_users_with_profile where email_id = '${email}' and user_status = 'Active'`,
                (err, result) => {
                  con.destroy();

                  console.log("mysql disconnected");

                  if (err) return res.status(404).json({ msg: "Not Found" });
                  if (result.length) {
                    let tokn = {};
                    let data = {
                      ID: result[0].user_id,
                    };
                    tokn.access = jwt.sign(data, process.env.ACCESS_TOKEN, {
                      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
                    });
                    tokn.refresh = jwt.sign(data, process.env.REFRESH_TOKEN, {
                      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
                    });
                    bcrypt.compare(
                      password,
                      result[0].password,
                      function (_, bol) {
                        console.log("bol is " + bol);
                        if (bol) {
                          let con = db();
                          con.connect(() => {
                            console.log("mysql connected");
                          });
                          con.query(
                            // `update users set token='${tokn.refresh}' where mobile_number=(select mobile_number from user_profile where email_id='${email}')`,
                            `update latest_users_with_profile set token = '${tokn.refresh}' where email_id = '${email}'`,
                            (e, r) => {
                              console.log("mysql disconnected");
                              con.destroy();
                            }
                          );
                          return res.status(200).json({
                            Tokens: tokn,
                            user: {
                              user_id: result[0].user_id,
                              role_name: result[0].role_name,
                              first_name: result[0].first_name,
                              last_name: result[0].last_name,
                              email: result[0].email_id,
                              gender: result[0].gender,
                              city: result[0].city,
                              mobile_number: result[0].mobile_number,
                            },
                          });
                        } else
                          return res
                            .status(404)
                            .json({ msg: "Invalid Username or Password!" });
                      }
                    );
                    console.log("mysql disconnected");
                    con.destroy();
                  } else {
                    return res.status(404).json({ msg: "Invalid Credentials" });
                  }
                }
              );
            };
            // if (result[0].user_role_id == 3) {
            //   if(ip==process.env.CUSTOMER_CARE_IP ||ip== "0.0.0.0"){
            //     loginFunc();
            //   }else{
            //     res.status(404).json({msg:"please check your ip address"});
            //   }
            // }else{
              loginFunc();
            // }

            //  con.connect(() => {
            //   console.log("mysql connected");
            // });
            
          }
        );
      } else {
        return res.status(404).json({ msg: "Email does not exist" });
      }
    }
  );
};

exports.login = async (req, res) => {
  const { mobile_number, pass_or_otp, method } = req.body;
  let con = db();
  con.connect(() => {
    console.log("mysql connected");
  });
  con.query(
    `select user_id, password, (select first_name from user_profile where mobile_number='${mobile_number}') as first_name from users where mobile_number='${mobile_number}' and user_status='Active'`,
    (err, result) => {
      console.log("mysql disconnected");
      con.destroy();
      if (err) return res.status(404).json({ msg: "Not Found" });
      //console.log(result);
      if (result.length) {
        let tokn = {};
        let data = {
          ID: result[0].user_id,
        };
        tokn.access = jwt.sign(data, process.env.ACCESS_TOKEN, {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        });
        tokn.refresh = jwt.sign(data, process.env.REFRESH_TOKEN, {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        });
        if (method === "PASSWORD") {
          bcrypt.compare(pass_or_otp, result[0].password, function (_, bol) {
            if (bol) {
              let con = db();
              con.connect(() => {
                console.log("mysql connected");
              });
              con.query(
                `update users set token='${tokn.refresh}' where mobile_number='${mobile_number}'`,
                (e, r) => {
                  console.log("mysql disconnected");
                  con.destroy();
                }
              );
              // console.log("disconnected from mysql");
              return res
                .status(200)
                .json({ Tokens: tokn, name: result[0].first_name });
            } else return res.status(404).json({ msg: "Invalid Username or Password!" });
          });
        } else if (method === "OTP") {
          let con = db();
          con.connect(() => {
            console.log("mysql connected");
          });
          let otp = parseInt(pass_or_otp);
          //console.log('otp ',otp);
          con.query(
            `call prc_verify_otp('${mobile_number}','${otp}')`,
            (err, r) => {
              console.log("mysql disconnected");
              // con.destroy();
              if (err) return res.status(404).json({ msg: "Not Found" });
              const { msg, otp, status } = DBMsgOtpStatus(r);
              //console.log('status ',status);
              if (status == 0) {
                // con.destroy();
                return res.status(status).json({ msg: msg });
              }
              let con = db();
              con.connect(() => {
                console.log("mysql connected");
              });
              con.query(
                `update users set token='${tokn.refresh}' where mobile_number='${mobile_number}'`,
                (err, result) => {
                  console.log("mysql disconnected");
                  con.destroy();
                  if (err) return res.status(404).json({ msg: "not found" });
                }
              );
              //console.log(r);
              // return res.send(result);
              return res
                .status(200)
                .json({ Tokens: tokn, name: result[0].first_name });
            }
          );
        }
        console.log("mysql disconnected");
        con.destroy();
      } else {
        return res.status(404).json({ msg: "Invalid Credentials" });
      }
    }
  );
};

exports.register = async (req, res) => {
  const {
    first_name_v,
    last_name_v,
    father_name_v,
    sos_person_name_v,
    sos_person_mobile_number_v,
    email_id_v,
    country_code_v,
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
    mobile_number_v,
    password_v,
    user_role_v,
    gender_v,
    blood_group_v,
    profile_picture_v,
  } = req.body;
  var imageUrl;
  let filePath = `register_profile_picture/${first_name_v}`;
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
      `call prc_register_user(
        '${RepWithSlash(first_name_v)}',
       '${RepWithSlash(last_name_v)}',
        '${RepWithSlash(father_name_v)}',
      '${RepWithSlash(sos_person_name_v)}',
      '${ReplaceWithEmp(sos_person_mobile_number_v)}',
      '${email_id_v}',
      '${ReplaceWithEmp(country_code_v)}',
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
      '${ReplaceWithEmp(mobile_number_v)}',
      '${hashing}',
      '${ReplaceWithEmp(user_role_v)}',
      '${ReplaceWithEmp(gender_v)}',
      '${ReplaceWithEmp(blood_group_v)}',
      '${RepWithSlash(imageUrl)}'
      )`,
      async (err, result) => {
        if (process.env.IS_LOG_REQUIRED == 1) {
          myLogs(err, result, "prc_register_user");
        }

        con.destroy();
        if (err) return res.status(404).json({ msg: "not found" });

        const { msg, otp, status } = DBMsgOtpStatus(result);
        console.log(otp);
        var otpMessage =
          "OTP is " +
          otp +
          " for your Registration to GADIBIZ.COM. Valid for 1 hour.Do not share OTP for security reasons.";
        sendSms(mobile_number_v, otpMessage);

        return res.status(status).json({ msg });
      }
    );
  });
};

exports.verifyRegistrationOtp = async (req, res) => {
  const { mobile_number, OTP } = req.body;
  if (mobile_number) {
    const con = db();
    con.connect(() => {
      console.log("mysql connected");
    });
    let otp = parseInt(OTP);
    con.query(
      `call prc_verify_otp(
        '${mobile_number}',
        ${otp}
        );`,
      (err, result) => {
        if (process.env.IS_LOG_REQUIRED == 1) {
          myLogs(err, result, "prc_verify_otp");
        }
        console.log("mysql disconnected");
        con.destroy();

        if (err) return res.status(404).json({ msg: "not found" });
        //console.log(result);

        const { msg, otp, status } = DBMsgOtpStatus(result);

        res.status(status).json({ msg });
      }
    );
  }
};

exports.registerFromCC = async (req, res) => {
  const {
    customer_care_user_id,
    fName,
    lName,
    father_name_v,
    sos_person_name_v,
    sos_person_mobile_number_v,
    email,
    country_code,
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
    password,
    gender,
    city,
    mobile_number,
    user_role_id,
  } = req.body;
  var imageUrl;
  let filePath = `profile_picture_from_CC/${req.ID}`;
  if (profile_picture_v != null) {
    if (profile_picture_v.length > 30) {
      imageUrl = await uploadImage(profile_picture_v, filePath);
    }
  }

  // bcrypt for hashing password------------------>
  bcrypt.hash(password, 10, (err, hashing) => {
    const con = db();
    con.connect(() => {});
    con.query(
      `call bo_add_user_by_customer_care(
        '${req.ID}',
        '${RepWithSlash(fName)}',
      '${RepWithSlash(lName)}',
      '${RepWithSlash(father_name_v)}',
      '${RepWithSlash(sos_person_name_v)}',
      '${ReplaceWithEmp(sos_person_mobile_number_v)}',
      '${email}',
      '${ReplaceWithEmp(country_code)}',
      '${RepWithSlash(city)}',
      '${RepWithSlash(landmark_v)}',
      '${RepWithSlash(location_v)}',
      '${RepWithSlash(address_v)}',
      '${ReplaceWithEmp(pin_v)}',
      '${RepWithSlash(prmnt_city_v)}',
      '${RepWithSlash(prmnt_landmark_v)}',
      '${RepWithSlash(prmnt_location_v)}',
      '${RepWithSlash(prmnt_address_v)}',
      '${ReplaceWithEmp(prmnt_pin_v)}',
      '${ReplaceWithEmp(mobile_number)}',
      '${hashing}',
      '${ReplaceWithEmp(user_role_id)}',
      '${ReplaceWithEmp(gender)}',
      '${RepWithSlash(blood_group_v)}',
      '${RepWithSlash(imageUrl)}'
      )`,
      async (err, result) => {
        if (process.env.IS_LOG_REQUIRED == 1) {
          myLogs(err, result, "bo_add_user_by_customer_care");
        }

        con.destroy();
        if (err) return res.status(404).json({ msg: "not found" });
        const { msg, status, User_ID } = DBMsgOtpStatus(result);
        return res.status(status).json({ msg, User_ID });
      }
    );
  });
};

exports.verifyRegesterOtp = async (req, res) => {
  const { mobile_number, OTP, otp_type } = req.body;
  var method = "OTP";
  let con = db();
  con.connect(() => {
    console.log("mysql connected");
  });
  con.query(
    `Select u.user_id,role.role_name,u.first_name,u.last_name,u.email_id,u.gender,u.mobile_number,u.city from latest_users_with_profile u inner join role on u.user_role_id = role.role_id where u.mobile_number = '${mobile_number}'`,
    (err, result) => {
      con.destroy();
      if (err) return res.status(404).json({ msg: "Not Found" });

      if (result.length) {
        let tokn = {};
        let data = {
          ID: result[0].user_id,
        };
        tokn.access = jwt.sign(data, process.env.ACCESS_TOKEN, {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        });
        tokn.refresh = jwt.sign(data, process.env.REFRESH_TOKEN, {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        });

        if (method === "OTP") {
          let con = db();
          con.connect(() => {});
          let otp = parseInt(OTP);
          con.query(
            `call prc_verify_otp(
              '${mobile_number}',
              '${otp}'
              )`,
            (err, r) => {
              if (process.env.IS_LOG_REQUIRED == 1) {
                myLogs(err, r, "prc_verify_otp");
              }

              if (err) return res.status(404).json({ msg: "Not Found" });
              const { msg, otp, status } = DBMsgOtpStatus(r);
              console.log(status);

              if (status == 200) {
                let con = db();
                con.connect(() => {});
                con.query(
                  `update users set token='${tokn.refresh}' where mobile_number='${mobile_number}'`,
                  (err, result) => {
                    con.destroy();
                    if (err) return res.status(404).json({ msg: "not found" });
                  }
                );
                return res.status(200).json({ Tokens: tokn, user: result });
              } else if (status == 403) {
                const { msg, status } = DBMsgOtpStatus(r);
                return res.status(status).json({ msg });
              }
              return res.status(404).json({ msg: "Invalid Credentials" });
            }
          );
        }

        con.destroy();
      } else {
        return res.status(404).json({ msg: "Invalid Credentials" });
      }
    }
  );
};

exports.addUserByAdmin = async (req, res) => {
  const {
    admin_user_id,
    fName,
    lName,
    father_name_v,
    sos_person_name_v,
    sos_person_mobile_number_v,
    email,
    country_code,
    city,
    mobile_number,
    password,
    user_role_id,
    gender,
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
  let filePath = `profile_picture_from_admin/${req.ID}`;
  if (profile_picture_v != null) {
    if (profile_picture_v.length > 30) {
      imageUrl = await uploadImage(profile_picture_v, filePath);
    }
  }

  // bcrypt for hashing password------------------>
  bcrypt.hash(password, 10, (err, hashing) => {
    const con = db();
    con.connect(() => {});
    con.query(
      `call bo_add_user_by_admin(
      '${req.ID}',
      '${RepWithSlash(fName)}',
      '${RepWithSlash(lName)}',
      '${RepWithSlash(father_name_v)}',
      '${RepWithSlash(sos_person_name_v)}',
      '${ReplaceWithEmp(sos_person_mobile_number_v)}',
      '${email}',
      '${ReplaceWithEmp(country_code)}',
      '${RepWithSlash(city)}',
      '${RepWithSlash(landmark_v)}',
      '${RepWithSlash(location_v)}',
      '${RepWithSlash(address_v)}',
      '${ReplaceWithEmp(pin_v)}',
      '${RepWithSlash(prmnt_city_v)}',
      '${RepWithSlash(prmnt_landmark_v)}',
      '${RepWithSlash(prmnt_location_v)}',
      '${RepWithSlash(prmnt_address_v)}',
      '${ReplaceWithEmp(prmnt_pin_v)}',
      '${ReplaceWithEmp(mobile_number)}',
      '${hashing}',
      '${ReplaceWithEmp(user_role_id)}',
      '${ReplaceWithEmp(gender)}',
      '${RepWithSlash(blood_group_v)}',
      '${RepWithSlash(imageUrl)}'
      )`,
      async (err, result) => {
        console.log(result);
        if (process.env.IS_LOG_REQUIRED == 1) {
          myLogs(err, result, "bo_add_user_by_admin");
        }

        con.destroy();
        if (err) return res.status(404).json({ msg: err });
        const { msg, status } = DBMsgOtpStatus(result);
        if (status == 200) {
          const con = db();
          con.connect(() => {});
          con.query(
            `select role_name from role where role_id ='${user_role_id}'`,
            async (e, r) => {
              con.destroy();
              if (e) {
              }
              var today = new Date();
              var time =
                today.getHours() +
                ":" +
                today.getMinutes() +
                ":" +
                today.getSeconds();
              sendEmail(fName, r[0].role_name, time);
            }
          );
        }
        return res.status(status).json({ msg });
      }
    );
  });
};

exports.addMechanicProfile = async (req, res) => {
  const {
    mechanic_user_id,
    state_v,
    city_v,
    location_v,
    address_v,
    pin_v,
    latitude_v,
    longitude_v,
  } = req.body;
  const con = db();
  con.connect(() => {
    console.log("mysql connected");
  });
  con.query(
    `call bo_add_mechanic_profile(
    '${req.ID}',
    '${RepWithSlash(state_v)}',
    '${RepWithSlash(city_v)}',
    '${RepWithSlash(location_v)}',
    '${RepWithSlash(address_v)}',
    '${ReplaceWithEmp(pin_v)}',
    '${RepWithSlash(latitude_v)}',
    '${RepWithSlash(longitude_v)}'
    )`,
    async (err, result) => {
      if (process.env.IS_LOG_REQUIRED == 1) {
        myLogs(err, result, "bo_add_mechanic_profile");
      }
      con.destroy();
      if (err) return res.status(404).json({ msg: "not found" });
      const { msg, status } = DBMsgOtpStatus(result);
      return res.status(status).json({ msg });
    }
  );
};
