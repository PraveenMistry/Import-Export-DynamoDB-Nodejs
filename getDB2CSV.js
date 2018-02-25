var json2csv = require('json2csv');
var fs = require('fs');
var newLine = "\r\n";

var AWS = require('aws-sdk');
var docClient = new AWS.DynamoDB.DocumentClient({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1' //change to your region
});

var params = {
    TableName: "test"
};

//headers 
var fields = [];
console.log("Scanning test table.");
docClient.scan(params, onScan);
var callCount = 0;
var count=0;
function onScan(err, data) {
    callCount++;
    console.log("Call Count" + callCount);
    if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } 
    else {
        count+=data.Count;
        console.log(count);
        console.log("Scan succeeded.");
        if (callCount == 1) {
            for (var idx in data.Items) {
                var i = data.Items[idx];
                
                for (var key in i) {
                    fields.push(key.toString());
                }
               /* fields.push("a.carpetBrushSpeed");
                fields.push("a.floorSenseIsOn");
                fields.push("a.hardFloorBrushSpeed");*/
                break;
            }
        }
        var toCsv = {
            data: data.Items,
            fields: fields,
            hasCSVColumnTitle: false
        };
        //check file is exist or not
        fs.stat('test.csv', function (err, stat) {
            if (err == null) {
                console.log('File exists');

                //append the actual data and end with newline
                var csv = json2csv(toCsv) + newLine;

                fs.appendFile('test.csv', csv, function (err) {
                    if (err) throw err;
                    console.log('The data  appended to file!');
                });
            }
            else {
                //write the headers and data
                console.log('New file,  writing headers and data');
                var csv = json2csv({ data: data.Items, fields: fields });
                fs.writeFile('test.csv', csv, function (err) {
                    if (err) throw err;
                    console.log('file saved');
                });
            }
        });
        // continue scanning if we have more records, because
        // scan can retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey != "undefined") {
            console.log("Scanning for more...");
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.scan(params, onScan);
        }


    }
}