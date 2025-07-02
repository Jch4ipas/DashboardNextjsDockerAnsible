import { parseString } from "xml2js";
import axios from "axios";

class Event{
    constructor(startDate, endDate, eventSubject, organizerName){
        this.debut = startDate; //.start.dateTime (calculate with .start.timeZone)
        this.fin = endDate; //.end.dateTime (calculate with .end.timeZone)
        this.sujet = eventSubject; //.subject
        this.organisateur = organizerName; //.organizer.emailAddress.name
    }
};

const callPostAPI = async(req) => {
  const response = await axios.post(
    process.env.AUTH_EWS_SERVICE_ENDPOINT,
    req,
    {
      headers: {
        'Content-Type': 'text/xml',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.AUTH_EWS_CREDENTIALS_USERNAME}:${process.env.AUTH_EWS_CREDENTIALS_PASSWORD}`).toString('base64'),
      }
    }
  );
  return response;
}

export default async(roomName) => {
  const room = roomName.toLowerCase()+"@epfl.ch";
  const isoStart = (new Date()).toISOString();
  const isoEnd = (new Date((new Date()).setUTCHours(23, 59, 59, 999))).toISOString();
//   const isoStart = "2025-06-01T12:30:21Z";
//   const isoEnd = "2025-07-01T12:30:21Z";
  const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages"
      xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"
      xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Header>
      <t:RequestServerVersion Version="Exchange2016" />
    </soap:Header>
    <soap:Body>
      <m:FindItem Traversal="Shallow">
        <m:ItemShape>
          <t:BaseShape>IdOnly</t:BaseShape>
          <t:AdditionalProperties>
            <t:FieldURI FieldURI="item:Subject" />
            <t:FieldURI FieldURI="calendar:Start" />
            <t:FieldURI FieldURI="calendar:End" />
            <t:FieldURI FieldURI="calendar:Organizer" />
          </t:AdditionalProperties>
        </m:ItemShape>
        <m:CalendarView StartDate="${isoStart}" EndDate="${isoEnd}" />
        <m:ParentFolderIds>
          <t:DistinguishedFolderId Id="calendar">
            <t:Mailbox>
              <t:EmailAddress>${room}</t:EmailAddress>
            </t:Mailbox>
          </t:DistinguishedFolderId>
        </m:ParentFolderIds>
      </m:FindItem>
    </soap:Body>
  </soap:Envelope>`

  let xmlResponse = await callPostAPI(xmlRequest)
  let jsonResponse = ""
  parseString(xmlResponse.data, function (err, result) {
    jsonResponse = result["s:Envelope"]["s:Body"][0]
      ["m:FindItemResponse"][0]
      ["m:ResponseMessages"][0]
      ["m:FindItemResponseMessage"][0];
  });

    // Check if the request occured an error
    if (jsonResponse["$"]["ResponseClass"] != "Success") {
        return { error: { code: "errUserAccessMissing", message: jsonResponse["m:MessageText"][0] } }
    }

    jsonResponse = jsonResponse["m:RootFolder"][0]

    // Check if the request return 0 events
    if (jsonResponse["$"].TotalItemsInView == 0) {
        return { error: { code: "errUserNoData", message: "No data during provided period." } }
    }

    let items = jsonResponse["t:Items"][0]["t:CalendarItem"];
  items = items.map((item)=> new Event(item["t:Start"][0], item["t:End"][0], item["t:Subject"][0], item["t:Organizer"][0]["t:Mailbox"][0]["t:Name"][0]))
  return items
}