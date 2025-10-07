const moment = require('moment');
const Payment = require('../models/Payment.model');
const { createPayment, getPaymentStatus } = require('../services/mollie.service');
const TherapySchedule = require('../models/therapySchedule.model');
const Pricing = require('../models/Pricing.model');
const Meeting = require('../models/meeting.model');
const User = require('../models/user.model');
const { createZoomMeeting } = require('../services/zoom.service');
const sendSessionSummaryEmail = require('../utils/sendSessionSummaryEmail');


// exports.initiateBookingPayment = async (req, res) => {
//   try {
//     const { therapyScheduleId, method, paymentOption } = req.body;

//     // Validate input
//     if (!therapyScheduleId || !method) {
//       return res.status(400).json({ error: "TherapySchedule ID & method are required" });
//     }

//     const schedule = await TherapySchedule.findById(therapyScheduleId);
//     if (!schedule) return res.status(404).json({ error: "Schedule not found" });

//     // Calculate time to session start
//     const sessionStart = schedule.sessions[0].date;
//     const now = new Date();
//     const hoursToSession = (new Date(sessionStart) - now) / (1000 * 60 * 60);
//     const totalPrice = 500;  // Always 500 for this product
//     const bookingFeeAmount = 100;
//     const finalPaymentAmount = totalPrice - bookingFeeAmount; // 400

//     // 1️⃣ Final payment logic for split (manual initiation)
//     if (paymentOption === 'final') {
//       // Check if booking fee has already been paid
//       const paidBookingFee = await Payment.findOne({
//         therapyScheduleId,
//         paymentType: 'bookingFee',
//         paymentStatus: 'paid'
//       });
//       if (!paidBookingFee) {
//         return res.status(400).json({ error: 'Booking fee not paid yet or does not exist' });
//       }
//       // Check if final payment already exists to avoid duplicates
//       const existingFinalPayment = await Payment.findOne({
//         therapyScheduleId,
//         paymentType: 'finalPayment'
//       });
//       if (existingFinalPayment) {
//         return res.status(400).json({ error: 'Final payment already initiated' });
//       }

//       // Initiate final payment
//       const finalPayment = await Payment.create({
//         category_id: schedule.category_id,
//         userId: schedule.user,
//         therapyScheduleId: schedule._id,
//         sessionPlan: schedule.sessionPlan,
//         price: finalPaymentAmount,
//         method,
//         paymentType: 'finalPayment',
//         paymentStatus: 'pending'
//       });
//       const molliePayment = await createPayment(
//         finalPaymentAmount,
//         `Final payment for therapy schedule ${therapyScheduleId}`,
//         `${process.env.CLIENT_URL}/payment-success?id=${finalPayment._id}`,
//         `${process.env.SERVER_URL}`,
//         method
//       );
//       finalPayment.transactionId = molliePayment.id;
//       await finalPayment.save();
//       return res.json({
//         checkoutUrl: molliePayment._links.checkout.href,
//         payment: finalPayment,
//       });
//     }

//     // 2️⃣ Full payment case (either forced or customer chooses)
//     if (hoursToSession <= 48 || paymentOption === 'full') {
//       const fullPayment = await Payment.create({
//         category_id: schedule.category_id,
//         userId: schedule.user,
//         therapyScheduleId: schedule._id,
//         sessionPlan: schedule.sessionPlan,
//         price: totalPrice,
//         method,
//         paymentStatus: 'pending',
//         paymentType: 'full',
//       });
//       const molliePayment = await createPayment(
//         totalPrice,
//         `Full payment for therapy schedule ${therapyScheduleId}`,
//         `${process.env.CLIENT_URL}/payment-success?id=${fullPayment._id}`,
//         `${process.env.SERVER_URL}`,
//         method
//       );
//       fullPayment.transactionId = molliePayment.id;
//       await fullPayment.save();
//       return res.json({
//         checkoutUrl: molliePayment._links.checkout.href,
//         payment: fullPayment,
//       });
//     }

//     // 3️⃣ Initial split payment (booking fee)
//     if (paymentOption === 'split') {
//       const bookingPayment = await Payment.create({
//         category_id: schedule.category_id,
//         userId: schedule.user,
//         therapyScheduleId: schedule._id,
//         sessionPlan: schedule.sessionPlan,
//         price: bookingFeeAmount,
//         method,
//         paymentStatus: 'pending',
//         paymentType: 'bookingFee',
//       });
//       const molliePayment = await createPayment(
//         bookingFeeAmount,
//         `Booking fee for therapy schedule ${therapyScheduleId}`,
//         `${process.env.CLIENT_URL}/payment-success?id=${bookingPayment._id}`,
//         `${process.env.SERVER_URL}`,
//         method
//       );
//       bookingPayment.transactionId = molliePayment.id;
//       await bookingPayment.save();
//       return res.json({
//         checkoutUrl: molliePayment._links.checkout.href,
//         payment: bookingPayment,
//       });
//     }

//     // If none matched, invalid option
//     return res.status(400).json({ error: 'Invalid payment option or conditions not met.' });

//   } catch (err) {
//     console.error("Error in initiateBookingPayment:", err);
//     res.status(500).json({ error: err.message || 'Failed to initiate payment' });
//   }
// };

exports.initiateBookingPayment = async (req, res) => {
  try {
    const { therapyScheduleId, method, paymentOption } = req.body;

    // Validate input
    if (!therapyScheduleId || !method) {
      return res.status(400).json({ error: "TherapySchedule ID & method are required" });
    }

    const schedule = await TherapySchedule.findById(therapyScheduleId);
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });

    // Pricing lookup
    const pricing = await Pricing.findOne({
      categoryId: schedule.category_id,
      durationMinutes: schedule.sessions && schedule.sessions.length > 0 ?
        moment(schedule.sessions[0].end, "hh:mm A").diff(moment(schedule.sessions[0].start, "hh:mm A"), "minutes") : undefined,
      sessionCount: schedule.sessions.length,
      status: "active"
    });
    if (!pricing) {
      return res.status(400).json({ error: "Matching pricing not found." });
    }

    // For single session plans, always use total price, NO booking or final fee splits
    const isSingleSession = schedule.sessionPlan === "single";
    const totalPrice = pricing.totalPrice;
    const bookingFeeAmount = pricing.bookingFeeAmount;
    const finalPaymentAmount = pricing.finalPaymentAmount;

    // 1️⃣ Single session: only full payment allowed
    if (isSingleSession) {
      if (paymentOption !== "full") {
        return res.status(400).json({ error: "Single sessions require full payment." });
      }
      const fullPayment = await Payment.create({
        category_id: schedule.category_id,
        userId: schedule.user,
        therapyScheduleId: schedule._id,
        sessionPlan: schedule.sessionPlan,
        price: totalPrice,
        method,
        paymentStatus: 'pending',
        paymentType: 'full'
      });
      const molliePayment = await createPayment(
        totalPrice,
        `Full payment for therapy schedule ${therapyScheduleId}`,
        // `${process.env.CLIENT_URL}/payment-success?id=${fullPayment._id}`,
        `${process.env.CLIENT_URL}/payment.html?id=${fullPayment._id}`,
        `${process.env.SERVER_URL}`,
        method
      );
      fullPayment.transactionId = molliePayment.id;
      await fullPayment.save();
      return res.json({
        checkoutUrl: molliePayment._links.checkout.href,
        payment: fullPayment,
      });
    }

    // 2️⃣ Package: Initial split payment (booking fee)
    if (paymentOption === 'split') {
      const bookingPayment = await Payment.create({
        category_id: schedule.category_id,
        userId: schedule.user,
        therapyScheduleId: schedule._id,
        sessionPlan: schedule.sessionPlan,
        price: bookingFeeAmount,
        method,
        paymentStatus: 'pending',
        paymentType: 'bookingFee',
      });
      const molliePayment = await createPayment(
        bookingFeeAmount,
        `Booking fee for therapy schedule ${therapyScheduleId}`,
        `${process.env.CLIENT_URL}/payment.html?id=${bookingPayment._id}`,
        `${process.env.SERVER_URL}`,
        method
      );
      bookingPayment.transactionId = molliePayment.id;
      await bookingPayment.save();
      return res.json({
        checkoutUrl: molliePayment._links.checkout.href,
        payment: bookingPayment,
      });
    }

    // 3️⃣ Package: Final payment logic
    if (paymentOption === 'final') {
      // Ensure booking fee paid
      const paidBookingFee = await Payment.findOne({
        therapyScheduleId,
        paymentType: 'bookingFee',
        paymentStatus: 'paid'
      });
      if (!paidBookingFee) {
        return res.status(400).json({ error: 'Booking fee not paid yet or does not exist' });
      }
      // Check for duplicate final payment
      const existingFinalPayment = await Payment.findOne({
        therapyScheduleId,
        paymentType: 'finalPayment'
      });
      if (existingFinalPayment) {
        return res.status(400).json({ error: 'Final payment already initiated' });
      }
      const finalPayment = await Payment.create({
        category_id: schedule.category_id,
        userId: schedule.user,
        therapyScheduleId: schedule._id,
        sessionPlan: schedule.sessionPlan,
        price: finalPaymentAmount,
        method,
        paymentType: 'finalPayment',
        paymentStatus: 'pending'
      });
      const molliePayment = await createPayment(
        finalPaymentAmount,
        `Final payment for therapy schedule ${therapyScheduleId}`,
        `${process.env.CLIENT_URL}/payment.html?id=${finalPayment._id}`,
        `${process.env.SERVER_URL}`,
        method
      );
      finalPayment.transactionId = molliePayment.id;
      await finalPayment.save();
      return res.json({
        checkoutUrl: molliePayment._links.checkout.href,
        payment: finalPayment,
      });
    }

    // 4️⃣ Package: Full payment case (customer chooses or less than 48h to session)
    const hoursToSession = (new Date(schedule.sessions[0].date) - new Date()) / (1000 * 60 * 60);
    if (hoursToSession <= 48 || paymentOption === 'full') {
      const fullPayment = await Payment.create({
        category_id: schedule.category_id,
        userId: schedule.user,
        therapyScheduleId: schedule._id,
        sessionPlan: schedule.sessionPlan,
        price: totalPrice,
        method,
        paymentStatus: 'pending',
        paymentType: 'full',
      });
      const molliePayment = await createPayment(
        totalPrice,
        `Full payment for therapy schedule ${therapyScheduleId}`,
        `${process.env.CLIENT_URL}/payment.html?id=${fullPayment._id}`,
        `${process.env.SERVER_URL}`,
        method
      );
      fullPayment.transactionId = molliePayment.id;
      await fullPayment.save();
      return res.json({
        checkoutUrl: molliePayment._links.checkout.href,
        payment: fullPayment,
      });
    }

    // If none matched, invalid payment option
    return res.status(400).json({ error: 'Invalid payment option or conditions not met.' });

  } catch (err) {
    console.error("Error in initiateBookingPayment:", err);
    res.status(500).json({ error: err.message || 'Failed to initiate payment' });
  }
};


/*Confirms payment updates isPaid and paymentType
Deletes schedule if no payment after 30 minutes (only if paymentType is null)
Updates schedule price by one or the sum of two payments*/

// exports.paymentWebhook = async (req, res) => {
//   try {
//     const paymentId = req.body.id;
//     const mollieData = await getPaymentStatus(paymentId);

//     // Delete TherapySchedule on Mollie failure states
//     if (["authorized", "canceled", "expired", "failed"].includes(mollieData.status)) {
//       const paymentRecord = await Payment.findOne({ transactionId: paymentId });
//       if (paymentRecord) {
//         await TherapySchedule.findByIdAndDelete(paymentRecord.therapyScheduleId);
//         await Payment.deleteMany({ therapyScheduleId: paymentRecord.therapyScheduleId });
//       }
//       return res.status(200).json({
//         status: 200,
//         success: true,
//         message: `TherapySchedule deleted due to payment status: ${mollieData.status}`,
//         data: {}
//       });
//     }

//     // Update payment status
//     const updatedStatus =
//       mollieData.status === "paid"
//         ? "paid"
//         : ["failed", "canceled"].includes(mollieData.status)
//         ? "failed"
//         : mollieData.status;

//     const paymentRecord = await Payment.findOneAndUpdate(
//       { transactionId: paymentId },
//       { paymentStatus: updatedStatus },
//       { new: true }
//     );

//     if (!paymentRecord) {
//       return res.status(200).json({
//         status: 200,
//         success: true,
//         message: "NO PAYMENT FOUND, IGNORED",
//         data: {}
//       });
//     }

//     // Mark TherapySchedule as paid if payment successful
//     if (paymentRecord.paymentStatus === "paid") {
//       await TherapySchedule.findByIdAndUpdate(paymentRecord.therapyScheduleId, {
//         isPaid: true,
//         paymentType: paymentRecord.paymentType,
//         expiresAt: null, // stop auto-deletion
//         isApproved: "approved",
//         status: "approved"
//       });

//       // Fetch related user & schedule
//       const user = await User.findById(paymentRecord.userId);
//       const schedule = await TherapySchedule.findById(paymentRecord.therapyScheduleId);

//       if (user && schedule && schedule.sessions && schedule.sessions.length > 0) {
//         // Create Zoom meetings for all sessions
//         for (const session of schedule.sessions) {
//           const sessionDateTime = moment(session.date)
//             .hour(parseInt(session.start.split(':')[0]))
//             .minute(parseInt(session.start.split(':')[1]));

//           try {
//             const zoomMeeting = await createZoomMeeting(
//               `Therapy Session for ${user.name}`,
//               sessionDateTime.toISOString()
//             );

//             // Save Meeting document for each session
//             await Meeting.create({
//               user: user._id,
//               therapySchedule: schedule._id,
//               payment: paymentRecord._id,
//               meetingLink: zoomMeeting.join_url,
//               scheduledAt: sessionDateTime.toDate(),
//               status: 'scheduled'
//             });

//           } catch (zoomErr) {
//             console.error(`Zoom meeting creation failed for session on ${sessionDateTime.toISOString()}`, zoomErr);
//             // continue with next session
//           }
//         }
//       }
//     }

//     // Auto-delete TherapySchedule after 15 mins if unpaid and paymentType null
//     const schedule = await TherapySchedule.findById(paymentRecord.therapyScheduleId);
//     if (schedule && schedule.isPaid === false && schedule.paymentType === null) {
//       const creationTime = new Date(schedule.createdAt);
//       const now = new Date();
//       const diffMins = (now - creationTime) / (1000 * 60);
//       if (diffMins >= 15) {
//         await TherapySchedule.findByIdAndDelete(schedule._id);
//         await Payment.deleteMany({ therapyScheduleId: schedule._id });
//         return res.status(200).json({
//           status: 200,
//           success: true,
//           message: "AUTO-DELETED TherapySchedule after 15 minutes with no payment",
//           data: {}
//         });
//       }
//     }

//     // Update TherapySchedule price based on paid payments
//     const payments = await Payment.find({
//       therapyScheduleId: paymentRecord.therapyScheduleId,
//       paymentStatus: "paid",
//     });
//     if (payments.length === 1) {
//       await TherapySchedule.findByIdAndUpdate(paymentRecord.therapyScheduleId, {
//         price: payments[0].price,
//       });
//     } else if (payments.length === 2) {
//       const totalPrice = payments.reduce((sum, p) => sum + p.price, 0);
//       await TherapySchedule.findByIdAndUpdate(paymentRecord.therapyScheduleId, {
//         price: totalPrice,
//       });
//     }

//     return res.status(200).json({
//       status: 200,
//       success: true,
//       message: "OK",
//       data: {}
//     });
//   } catch (error) {
//     console.error("Webhook error:", error);
//     return res.status(500).json({
//       status: 500,
//       success: false,
//       message: "Webhook processing failed",
//       data: {}
//     });
//   }
// };

exports.paymentWebhook = async (req, res) => {
  try {
    const paymentId = req.body.id;
    const mollieData = await getPaymentStatus(paymentId);

    // Delete TherapySchedule on Mollie failure states
    if (["authorized", "canceled", "expired", "failed"].includes(mollieData.status)) {
      const paymentRecord = await Payment.findOne({ transactionId: paymentId });
      if (paymentRecord) {
        await TherapySchedule.findByIdAndDelete(paymentRecord.therapyScheduleId);
        await Payment.deleteMany({ therapyScheduleId: paymentRecord.therapyScheduleId });
      }
      return res.status(200).json({
        status: 200,
        success: true,
        message: `TherapySchedule deleted due to payment status: ${mollieData.status}`,
        data: {}
      });
    }

    // Update payment status
    const updatedStatus =
      mollieData.status === "paid"
        ? "paid"
        : ["failed", "canceled"].includes(mollieData.status)
        ? "failed"
        : mollieData.status;

    const paymentRecord = await Payment.findOneAndUpdate(
      { transactionId: paymentId },
      { paymentStatus: updatedStatus },
      { new: true }
    );

    if (!paymentRecord) {
      return res.status(200).json({
        status: 200,
        success: true,
        message: "NO PAYMENT FOUND, IGNORED",
        data: {}
      });
    }

    // Mark TherapySchedule as paid if payment successful
    if (paymentRecord.paymentStatus === "paid") {
      await TherapySchedule.findByIdAndUpdate(paymentRecord.therapyScheduleId, {
        isPaid: true,
        paymentType: paymentRecord.paymentType,
        expiresAt: null, // stop auto-deletion
        isApproved: "approved",
        status: "approved"
      });   

      // Fetch related user & schedule
      const user = await User.findById(paymentRecord.userId);
      const schedule = await TherapySchedule.findById(paymentRecord.therapyScheduleId);

      if (user && schedule && schedule.sessions && schedule.sessions.length > 0) {
        const sessionDetails = [];

        for (const session of schedule.sessions) {
          const sessionDateStr = moment(session.date).format('YYYY-MM-DD');
          const startTime = moment(`${sessionDateStr} ${session.start}`, 'YYYY-MM-DD hh:mm A').toDate();
          const endTime = moment(`${sessionDateStr} ${session.end}`, 'YYYY-MM-DD hh:mm A').toDate();

          try {
            const zoomMeeting = await createZoomMeeting(
              `Therapy Session for ${user.name}`,
              startTime.toISOString()
            );

            await Meeting.create({
              user: user._id,
              therapySchedule: schedule._id,
              payment: paymentRecord._id,
              meetingLink: zoomMeeting.join_url,
              scheduledDate: session.date,
              scheduledStart: session.start,
              scheduledEndTime: session.end,
              scheduledAt: startTime,
              scheduledEnd: endTime,
              status: 'scheduled',
              startedAt: null,
              endedAt: null,
              notes: '',
              attended: false
            });

            sessionDetails.push({
              date: moment(session.date).format('dddd, MMMM Do YYYY'),
              start: session.start,
              end: session.end,
              meetingLink: zoomMeeting.join_url
            });
          } catch (zoomErr) {
            console.error(`Zoom meeting creation failed for session on ${startTime.toISOString()}`, zoomErr);
            // continue with next session
          }
        }

        // Send combined session summary email (non-blocking)
        sendSessionSummaryEmail(user.email, user.name, sessionDetails)
          .catch(err => console.error('Error sending session summary email:', err));
      }
    }

    // Auto-delete unpaid schedules after 15 mins
    const schedule = await TherapySchedule.findById(paymentRecord.therapyScheduleId);
    if (schedule && schedule.isPaid === false && schedule.paymentType === null) {
      const creationTime = new Date(schedule.createdAt);
      const now = new Date();
      const diffMins = (now - creationTime) / (1000 * 60);
      if (diffMins >= 15) {
        await TherapySchedule.findByIdAndDelete(schedule._id);
        await Payment.deleteMany({ therapyScheduleId: schedule._id });
        return res.status(200).json({
          status: 200,
          success: true,
          message: "AUTO-DELETED TherapySchedule after 15 minutes with no payment",
          data: {}
        });
      }
    }

    // Update TherapySchedule price based on paid payments
    const payments = await Payment.find({
      therapyScheduleId: paymentRecord.therapyScheduleId,
      paymentStatus: "paid",
    });
    if (payments.length === 1) {
      await TherapySchedule.findByIdAndUpdate(paymentRecord.therapyScheduleId, {
        price: payments[0].price,
      });
    } else if (payments.length === 2) {
      const totalPrice = payments.reduce((sum, p) => sum + p.price, 0);
      await TherapySchedule.findByIdAndUpdate(paymentRecord.therapyScheduleId, {
        price: totalPrice,
      });
    }

    return res.status(200).json({
      status: 200,
      success: true,
      message: "OK",
      data: {}
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Webhook processing failed",
      data: {}
    });
  }
};


exports.updatePaymentFromMollie = async (req, res) => {
  try {
    const { mongoId } = req.params;

    // 1. Find payment in Mongo
    const payment = await Payment.findById(mongoId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // 2. Fetch latest payment status from Mollie
    const mollieData = await getPaymentStatus(payment.transactionId);

    const updatedStatus =
      mollieData.status === "paid"
        ? "paid"
        : mollieData.status === "failed" || mollieData.status === "canceled"
        ? "failed"
        : mollieData.status;

    let cardDetails = {};
    if (mollieData.details && mollieData.details.card) {
      cardDetails = {
        last4: mollieData.details.card.last4,
        brand: mollieData.details.card.brand,
        cardHolder: mollieData.details.card.cardHolder,
      };
    }

    const finalPayment = mollieData.amount?.value
      ? Number(mollieData.amount.value)
      : 0;

    // 3. Update Mongo
    await Payment.findByIdAndUpdate(mongoId, {
      paymentStatus: updatedStatus,
      cardDetails: cardDetails,
      finalPayment: finalPayment,
    });

    // 4. Return updated payment
    const updatedPayment = await Payment.findById(mongoId)
      .populate("category_id")
      .populate("userId");

    res.json(updatedPayment);
  } catch (err) {
    console.error("Auto-update error:", err);
    res.status(500).json({ error: "Failed to update payment" });
  }
};



exports.getPaymentByTransactionId = async (req, res) => {
  try {
    const { transactionId } = req.params; // actually Mongo _id now
    const payment = await Payment.findById(transactionId)
      .populate('category_id')
      .populate('userId');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching payment details' });
  }
};
