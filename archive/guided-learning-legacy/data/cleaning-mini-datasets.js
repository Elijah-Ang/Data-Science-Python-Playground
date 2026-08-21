/* Small, deliberately messy fixtures for the Guided Learning cleaning planet. */
(function () {
  "use strict";

  window.CLEANING_MINI_DATASETS = {
    missing_values: {
      name: "Library members · missing values",
      sep: ",",
      note: "Eight readable rows with blank ages and scores; practise an explicit missing-value policy.",
      csv: "member_id,name,age,quiz_score\nM01,Ada,21,88\nM02,Bea,,91\nM03,Cleo,19,\nM04,Dev,24,73\nM05,Eli,,84\nM06,Finn,22,\nM07,Gia,20,95\nM08,Hugo,23,79\n"
    },
    duplicate_rows: {
      name: "Orders · duplicate rows",
      sep: ",",
      note: "One order is repeated exactly; keep the first copy and preserve the order count.",
      csv: "order_id,customer,amount\nO101,Ada,18.50\nO102,Bea,24.00\nO103,Cleo,12.75\nO103,Cleo,12.75\nO104,Dev,31.20\nO105,Eli,9.99\nO106,Finn,44.10\nO107,Gia,16.40\n"
    },
    numeric_coercion: {
      name: "Workshop stock · numeric coercion",
      sep: ",",
      note: "The units column arrived as text with one blank and one placeholder.",
      csv: "item,units,unit_price\nnotebook,12,4.50\npen,8,1.20\nsticker,,0.80\nfolder,unknown,3.10\nmarker,15,2.40\nclip,21,0.60\ncard,7,1.75\nlabel,10,0.35\n"
    },
    category_normalization: {
      name: "Survey replies · category drift",
      sep: ",",
      note: "The same yes/no answer appears with whitespace, case drift, and shorthand.",
      csv: "response_id,status\nR01,Yes\nR02, yes \nR03,Y\nR04,No\nR05, no\nR06,N\nR07,YES\nR08,unknown\nR09, No \nR10,yes\n"
    },
    string_cleanup: {
      name: "Contacts · string cleanup",
      sep: ",",
      note: "Names and email addresses have surrounding spaces and inconsistent case.",
      csv: "contact_id,customer,email\nC01,  ada lovelace  , ADA@EXAMPLE.COM \nC02,grace hopper, grace@example.com\nC03,  KATHERINE JOHNSON,katherine@example.com  \nC04,alan turing , ALAN@EXAMPLE.COM\nC05, dorothy vaughan,dorothy@example.com\nC06, mary jackson ,MARY@EXAMPLE.COM\nC07,  franklin chang ,franklin@example.com\nC08,joy buolamwini, joy@example.com \n"
    },
    invalid_values: {
      name: "Workshop ratings · invalid values",
      sep: ",",
      note: "Quantity cannot be negative and ratings must stay on a one-to-five scale.",
      csv: "item,quantity,rating\nnotebook,4,5\npen,-2,4\nsticker,8,6\nfolder,3,3\nmarker,0,2\nclip,-1,4\ncard,6,0\nlabel,2,5\n"
    },
    outlier_decision: {
      name: "Delivery times · outlier decision",
      sep: ",",
      note: "Most deliveries are close together, with one extreme delay to flag and investigate.",
      csv: "delivery_id,route,minutes\nD01,A,31\nD02,A,29\nD03,B,35\nD04,B,33\nD05,A,30\nD06,B,32\nD07,A,28\nD08,B,36\nD09,A,31\nD10,B,240\n"
    },
    messy_orders: {
      name: "Orders · integrated cleaning challenge",
      sep: ",",
      note: "A compact end-to-end challenge combining duplicates, dates, numeric coercion, strings, categories, and invalid prices.",
      csv: "order_id,customer,order_date,product,quantity,unit_price,status\nO201,  Ada Lovelace ,01/06/2024,Notebook,2,4.50, shipped\nO202,grace hopper,02/06/2024,Pen,5,1.20,SHIPPED\nO203, KATHERINE JOHNSON,03/06/2024,Sticker,,0.80, pending\nO204,alan turing,04/06/2024,Folder,two,3.10,Pending\nO204,alan turing,04/06/2024,Folder,two,3.10,Pending\nO205, dorothy vaughan ,not-a-date,Marker,3,-2.40, shipped\nO206,mary jackson,06/06/2024,Clip,0,0.60, CANCELLED \nO207,franklin chang,07/06/2024,Card,4,1.75,shipped\nO208, joy buolamwini ,08/06/2024,Label,2,0.35,unknown\nO209,ada lovelace,09/06/2024,Notebook,1,4.50,SHIPPED\nO210,grace hopper,10/06/2024,Pen,6,1.20, shipped \nO211,katherine johnson,11/06/2024,Sticker,1,0.80,Pending\n"
    }
  };
}());
