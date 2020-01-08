const express = require('express');
const app = express();
const router = express.Router();
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const btoa = require("btoa");
var bodyParser = require("body-parser"); 
var httprequest = require( 'request' );
require('dotenv').config()

const apikey = process.env.APIKEY;
const ml_instance_id = process.env.ML_INSTANCE_ID;
const scoring_url = process.env.WML_URL;

var confidence_yes = 0.95
var confidence_no = 0.05

//Set view engine to ejs
app.set("view engine", "ejs"); 

//Tell Express where we keep our index.ejs
app.set("views", __dirname + "/views"); 

//Use body-parser
app.use(bodyParser.urlencoded({ extended: false })); 

//Instead of sending Hello World, we render index.ejs
app.get("/", (req, res) => { res.render("index", { response_string: "Waiting for request", confidence_yes:confidence_yes, confidence_no:confidence_no, payload:"Input Data"})}); 

function apiPost(scoring_url, token, mlInstanceID, payload, loadCallback, errorCallback){
	const oReq = new XMLHttpRequest();
	oReq.addEventListener("load", loadCallback);
	oReq.addEventListener("error", errorCallback);
	oReq.open("POST", scoring_url);
	oReq.setRequestHeader("Accept", "application/json");
	oReq.setRequestHeader("Authorization", token);
	oReq.setRequestHeader("ML-Instance-ID", mlInstanceID);
	oReq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	oReq.send(payload);
}

app.use(express.static('views'));
app.use(express.urlencoded());
app.use(express.json());

app.post('/predict', function(request, response1){
	var Gender = request.body.Gender
    var Married = request.body.Married
	var Dependents = request.body.Dependents
	var Self_Employed = request.body.Self_Employed
	var Property_Area = request.body.Property_Area
	var Education = request.body.Education
	var Loan_Amount_Term = request.body.Loan_Amount_Term
	var Credit_History = request.body.Credit_History
	var Loan_Amount = request.body.Loan_Amount
	var CoapplicantIncome = request.body.CoapplicantIncome
	var ApplicantIncome = request.body.ApplicantIncome
	var payload_scoring = {"input_data": [{"fields": ["Loan_ID", "Gender", "Married", "Dependents", "Education", "Self_Employed", "ApplicantIncome", "CoapplicantIncome", "LoanAmount", "Loan_Amount_Term", "Credit_History", "Property_Area"]
	                                    , "values": [["LP000000", Gender,   Married,   Dependents,   Education,   Self_Employed,   ApplicantIncome,   CoapplicantIncome,   Loan_Amount,  Loan_Amount_Term,   Credit_History,   Property_Area]]}]}

	var IBM_Cloud_IAM_uid = "bx";
	var IBM_Cloud_IAM_pwd = "bx";
	var options = { url     : "https://iam.bluemix.net/oidc/token",
    headers : { "Content-Type"  : "application/x-www-form-urlencoded",
    "Accept" : "application/json",
   	"Authorization" : "Basic " + btoa( IBM_Cloud_IAM_uid + ":" + IBM_Cloud_IAM_pwd )},
    body    : "apikey=" + apikey + "&grant_type=urn:ibm:params:oauth:grant-type:apikey" };

	httprequest.post( options, function( error, response, body ){
    	var iam_token = JSON.parse(body)["access_token"];
		const wmlToken = "Bearer " + iam_token;

		const mlInstanceId = ml_instance_id;
		apiPost(scoring_url, wmlToken, mlInstanceId, JSON.stringify(payload_scoring), function (resp) {
			let parsedPostResponse;
			parsedPostResponse = JSON.parse(this.responseText);
			console.log("Scoring response");
			console.log(JSON.stringify(parsedPostResponse));
			confidence_no = parsedPostResponse.predictions[0].values[0][1][0]
			confidence_yes = parsedPostResponse.predictions[0].values[0][1][1]
			response1.render("index", { response_string: JSON.stringify(parsedPostResponse), 
				confidence_yes:confidence_yes, confidence_no:confidence_no, payload:JSON.stringify(payload_scoring)}); 
		});
	});
});

app.use('/', router);
app.listen(process.env.PORT || 3000);

console.log('Running at Port 3000');