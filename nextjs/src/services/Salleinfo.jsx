"use client";

import { useEffect, useState } from "react";
import { parseString } from "xml2js";
import getOnPremEvents from "./getOnPremEvents";


export default ({room}) => {
    const [eventsData, setEventsData] = useState([])
    useEffect(()=>{
        let intervalID;
        const callAPI = async() => {
            try {
                const response = await fetch(`/api/getEvents?room=${room}`);
                if (!response.ok) {
                    throw new Error(`Response status: ${response.status}`);
                }
                const data = await response.json();
                setEventsData(data.items || []);
            } catch (error) {
                console.error("Erreur lors de la récupération des événements :",error.message);
                setEventsData([]);
            }
        }
        callAPI()

        intervalID = setInterval(callAPI, 15 * 60 * 1000);
        return () => clearInterval(intervalID);
    }, [room])
    return (
        <div>
            <span>Room : {room}</span><br />
            {eventsData.length > 0 ? (
                eventsData.reverse().slice(0, 2).map((event, index) => (
                    <div key={index}>
                        <span>début : {new Date(event.debut).toLocaleString('fr-CH')}</span><br></br>
                        <span>fin : {new Date(event.fin).toLocaleString('fr-CH')}</span><br></br>
                        <span>Sujet : {event.sujet}</span><br></br>
                        <span>organisateur : {event.organisateur}</span>
                        <hr />
                    </div>
                ))
            ) : (
                <div>Pas d'événement</div>
            )}  
        </div>
    );
}