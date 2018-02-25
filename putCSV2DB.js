var fs = require('fs');
var parse = require('csv-parse');
var async = require('async');
const AWS = require('aws-sdk');

const dynamodbDocClient = new AWS.DynamoDB({ 
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-west-2' //change to your region
});

var csv_filename = "test.csv";

rs = fs.createReadStream(csv_filename);


console.log('createReadStream',rs);

parser = parse({
    columns : true,
    delimiter : ','
}, function(err, data) {
    var split_arrays = [], size = 25;
    while (data.length > 0) {
     
        let cur25 = data.splice(0, size)
        let item_data = []

        for (var i = cur25.length - 1; i >= 0; i--) {
          const this_item = {
            "PutRequest" : {
              "Item": {
                // your column names here will vary, but you'll need do define the type
                "id": {
                  "S": cur25[i].id
                },
                "count": {
                  "N": cur25[i].count
                },
                "name": {
                  "N": cur25[i].name
                },
              }
            }
          };
          item_data.push(this_item)
        }
        split_arrays.push(item_data);
    }
    data_imported = false;
    chunk_no = 1;


    async.each(split_arrays, (item_data, callback) => {

        const params = {
            RequestItems: {
                "test" : item_data
            }
        }

        dynamodbDocClient.batchWriteItem(params, function(err, res, cap) {
            if (err === null) {
                console.log('Success chunk #' + chunk_no);
                data_imported = true;
            } else {
                console.log(err);
                console.log('Fail chunk #' + chunk_no);
                data_imported = false;
            }
            chunk_no++;
            callback();
        });

    }, () => {
        // run after loops
        console.log('all data imported....');

    });



});
rs.pipe(parser);