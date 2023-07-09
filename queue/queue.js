
var amqp = require('amqplib/callback_api');

function start() {
  amqp.connect(`${process.env.RABBITMQ_URL}?heartbeat=60`, function(err, conn) {
    if (err) {
      console.error("[AMQP]", err.message);
      return setTimeout(start, 1000);
    }

    conn.on("error", function(err) {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
      }
    });

    conn.on("close", function() {
      console.error("[AMQP] reconnecting");
        return setTimeout(start, 1000);
    });

    console.log("[AMQP] connected");
    amqpConn = conn;
    whenConnected();
  });
}

function whenConnected() {
  startPublisher();
  startWorkerTicketStatus();
}

var pubChannel = null;
var offlinePubQueue = [];
var exchange = 'easy-ticket';

function startPublisher() {
  amqpConn.createConfirmChannel(function(err, ch) {
    if (closeOnErr(err)) return;
      ch.on("error", function(err) {
      console.error("[AMQP] channel error", err.message);
    });
    ch.on("close", function() {
      console.log("[AMQP] channel closed");
    });
    pubChannel = ch;
    pubChannel.assertExchange(exchange, "x-delayed-message", {autoDelete: false, durable: true, passive: true,  arguments: {'x-delayed-type':  "direct"}})
    pubChannel.bindQueue('ticket-status', exchange ,'ticket-status');

    while (true) {
      var m = offlinePubQueue.shift();
      if (!m) break;
      publish(m[0], m[1], m[2]);
    }
  });
}

function publish(routingKey, content, delay) {
  try {
    pubChannel.publish(exchange, routingKey, content, {headers: {"x-delay": delay}},
      function(err, ok) {
        if (err) {
          console.error("[AMQP] publish", err);
          offlinePubQueue.push([exchange, routingKey, content]);
          pubChannel.connection.close();
        }
    });
  } catch (e) {
    console.error("[AMQP] failed", e.message);
    offlinePubQueue.push([routingKey, content, delay]);
  }
}

// A worker that acks messages only if processed succesfully
function startWorkerTicketStatus() {
  amqpConn.createChannel(function(err, ch) {
    if (closeOnErr(err)) return;
    ch.on("error", function(err) {
      console.error("[AMQP] channel error", err.message);
    });
    ch.on("close", function() {
      console.log("[AMQP] channel closed");
    });

    ch.prefetch(10);
    ch.assertQueue("ticket-status", { durable: true }, function(err, _ok) {
      if (closeOnErr(err)) return;
      ch.consume("ticket-status", processMsg, { noAck: false });
      console.log("Worker is started");
    });

    function processMsg(msg) {
      work(msg, function(ok) {
        try {
          if (ok)
            ch.ack(msg);
          else
            ch.reject(msg, true);
        } catch (e) {
          closeOnErr(e);
        }
      });
    }

    function work(msg, cb) {
      const jsonObject = JSON.parse(msg.content.toString());
      console.log("teste");
      cb(true);
    }
  });
}

function closeOnErr(err) {
  if (!err) return false;
  console.error("[AMQP] error", err);
  amqpConn.close();
  return true;
}

start();

module.exports = {
  publish
}


