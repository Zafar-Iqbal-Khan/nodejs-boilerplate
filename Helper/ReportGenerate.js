const pupp = require("puppeteer");
const hbs = require("handlebars");
const path = require("path");
const fs = require("fs-extra");
const fss = require('fs');
const { v4: uuidv4 } = require("uuid");

const compile = async function (templateName, data) {
  const filePath = path.join(process.cwd(), "template", `${templateName}.hbs`);
  const html = await fs.readFile(filePath, "utf-8");
  //console.log(html);
  return hbs.compile(html)(data);
};

exports.reportGenerate = async (result) => {
  try {
    const browser = await pupp.launch({
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();

    const content = await compile("page", result);

    await page.setContent(content);
    await page.emulateMediaType("screen");
    let path = `${uuidv4()}.pdf`;

    let reportFile = await page.pdf({
      path: path,
      format: "A4",
      printBackground: true,
    });

    fss.unlink(path, (err => {
      if (err) console.log(err);
      else {
        console.log("Temporary report pdf deleted");
      }
    }));

    await browser.close();

    return Promise.resolve(reportFile);
    // process.exit();
  } catch (error) {
    return Promise.reject('error ',error);
  }
}