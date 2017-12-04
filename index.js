'use strict';

const cluster = require('cluster');
const shelljs = require('shelljs');
require('dotenv').config()


if (cluster.isMaster) {
    for (let i = 0; i < process.env.numberOfClusters; i++)
        cluster.fork();

    // process.on('beforeExit', console.log('gonna exit'));

} else {

    var mongoose = require('mongoose'), Schema = mongoose.Schema;
    mongoose.Promise = global.Promise;
    mongoose.connect('mongodb://localhost:27017/testtt', { useMongoClient: true }).then(
        () => {
            let Load = mongoose.model('load', new Schema({
                workerId: { type: String },
                serialCount: Number,
                timeStart: Number,
                timeEnd: Number,
                totalTime: Number,
            }));

            const workerId = cluster.worker.id;
            let docs = [];
            for (let i = 0; i < process.env.loop; i++) {
                let timeStart = Date.now();
                shelljs.exec(` 
                curl -XPOST "http://localhost:9200/testtt/_search" -H 'Content-Type: application/json' -d' 
                    {
                    "query": {
                        "term" : { "story" : "network" } 
                    }
                }' > /dev/null `)
                let timeEnd = Date.now();
                docs.push({ serialCount: i, workerId, timeStart, timeEnd, totalTime: timeEnd - timeStart });
            }

            Load.insertMany(docs);
        },
        err => { /** handle initial connection error */ }
    );

}

