const schedule = require("node-schedule");
const fetch = require("node-fetch");
const notificationRouter = require("express").Router();

// Define time slots
const timeSlots = {
  0: "09:00", // Morning
  1: "12:00", // Noon
  2: "16:00", // Evening
  3: "20:00", // Night
};

// Function to send notifications via Expo Push API
async function sendPushNotification(expoPushToken, title, body) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title,
    body,
    data: { message: body },
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error("Failed to send push notification:", await response.text());
    } else {
      console.log("setted");
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

// Function to schedule notifications
function schedulePrescriptionNotifications(
  prescriptions,
  follow_upDate,
  expoPushToken
) {
  console.log("reached", prescriptions);
  const endDate = new Date(follow_upDate);
  if (isNaN(endDate)) {
    console.error("Invalid follow-up date");
    return;
  }

  const startDate = new Date(); // Current date

  prescriptions.forEach((item) => {
    const { medicine_name, dosage, time, days } = item;

    // Iterate through days of the week
    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      if (days[dayIndex] === "1") {
        for (let timeIndex = 0; timeIndex < time.length; timeIndex++) {
          if (time[timeIndex] === "1") {
            const notificationTime = timeSlots[timeIndex];
            const [hour, minute] = notificationTime.split(":").map(Number);

            // Schedule job for specific day and time
            schedule.scheduleJob(
              {
                dayOfWeek: dayIndex,
                hour,
                minute,
                start: startDate,
                end: endDate,
              },
              () => {
                console.log(
                  `Reminder: Take ${medicine_name} (${dosage}) on ${new Date().toLocaleString()}`
                );
                // Send push notification
                sendPushNotification(
                  expoPushToken,
                  `Time to take ${medicine_name}!`,
                  `Dosage: ${dosage}`
                );
              }
            );
          }
        }
      }
    }
  });
}

// Endpoint to receive prescriptions
notificationRouter.post("/", (req, res) => {
  const { prescriptions, follow_upDate, expoPushToken } = req.body;

  if (!prescriptions || !Array.isArray(prescriptions)) {
    return res.status(400).send({ message: "Invalid prescriptions format" });
  }

  if (!follow_upDate) {
    return res.status(400).send({ message: "Follow-up date is required" });
  }

  if (!expoPushToken) {
    return res.status(400).send({ message: "Expo Push Token is required" });
  }

  // Schedule notifications
  schedulePrescriptionNotifications(
    prescriptions,
    follow_upDate,
    expoPushToken
  );

  res.status(200).send({ message: "Prescriptions scheduled successfully" });
});

module.exports = notificationRouter;
