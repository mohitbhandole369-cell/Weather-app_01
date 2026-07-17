const API_KEY = "708c2fc2df3b47e48c4182250261607";

async function getWeather() {

    const city = document.getElementById("city").value;

    if(city===""){

        alert("Please Enter City Name");

        return;
    }

    const url=`http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}&aqi=yes`;

    try{

        const response = await fetch(url);

        const data = await response.json();

        if(data.error){

            alert(data.error.message);

            return;
        }

        document.getElementById("weather").style.display="block";

        document.getElementById("location").innerHTML=
        data.location.name + ", " + data.location.country;

        document.getElementById("temp").innerHTML=
        data.current.temp_c + " °C";

        document.getElementById("condition").innerHTML=
        data.current.condition.text;

        document.getElementById("humidity").innerHTML=
        data.current.humidity + "%";

        document.getElementById("wind").innerHTML=
        data.current.wind_kph + " km/h";

        document.getElementById("icon").src=
        "https:" + data.current.condition.icon;

    }

    catch(error){

        alert("Something went wrong!");

    }

}