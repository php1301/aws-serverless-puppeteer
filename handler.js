const serverless = require("serverless-http");
const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
// const puppeteer = require('puppeteer');
const handlebars = require("handlebars");
// const puppeteer = require('puppeteer-serverless');
// const {getChrome} = require('./chrome-script')
const chromium = require('chrome-aws-lambda');

const formatDate = () =>{
  const today = new Date();
  const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  const dateTime = date+' '+time;
  return dateTime
}


const createPDF = async (data) =>{
  try{
	const templateHtml = fs.readFileSync(path.join(process.cwd(), 'template.html'), 'utf8');
	const template = handlebars.compile(templateHtml);
	const html = template(data);
	let milis = new Date();
	milis = milis.getTime();

	const pdfPath = path.join('pdf', `${data.maVe}-${milis}.pdf`);

	const options = {
		margin: {
			top: "10px",
			bottom: "30px"
		},
		printBackground: true,
		// path: `${data.maVe}-${milis}.pdf`
    
	}
  const  browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });

	const page = await browser.newPage();
	
  const output = await page.setContent(html,{ waitUntil: ['domcontentloaded', 'load', "networkidle0"] }).then(async function (response) {
    //    page.emulateMedia('screen')
       const file = await page.pdf(options)
       return file;
      })
  await browser.close();
  return output;
}
catch(e){
  throw Error(e);
}
}
app.get("/", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from root!",
  });
});

app.get("/hello", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from path!",
  });
});
app.post('/print-pdf', async (req, res)=>{
    const data = JSON.parse(req.body.toString());
    const finalData ={...data, ngayXuatHoaDon: formatDate()}
    console.log(finalData);
    try {      
      const pdf = await createPDF(finalData);
      console.log("thành công")
      console.log(pdf)
      res.contentType("application/pdf");
      console.log("thành công 2")
      return res.status(200).send({
        file: pdf.toString("base64")
      });
    }
  catch(e){
    console.log("Có lỗi")
    console.log(e);
    console.log(pdf)
    return res.status(403).json({
      message: "Error",
      file: pdf.toString("base64")
    });
  }
}) 
app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
