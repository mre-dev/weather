const API_KEY = "pk.faac79ebf4c41ea94b5aeb398fc3d622";
const API_WEATHER = "9d9a8ffaf9b9d970a4c48940aeb98f65";
let currentCityInformation;

document.addEventListener("DOMContentLoaded", function() {
    navigator.geolocation.getCurrentPosition(async function(position) {
        const LATITUDE = position.coords.latitude;
        const LONGITUDE = position.coords.longitude;
        
        const fetchOption = {
            method: "GET"
        };

        await fetch(`https://eu1.locationiq.com/v1/reverse.php?key=${API_KEY}&lat=${LATITUDE}&lon=${LONGITUDE}&format=json`, fetchOption)
        .then(Response => Response.json())
        .then(async data => currentCityInformation = await data)
        .catch(error => console.log(error));

        if(currentCityInformation.address.city == undefined ) {
            await fetch(`https://us1.locationiq.com/v1/reverse.php?key=${API_KEY}&lat=${LATITUDE}&lon=${LONGITUDE}&format=json`, fetchOption)
            .then(Response => Response.json())
            .then(async data => currentCityInformation = await data)
            .catch(error => console.log(error));
        }

        findWatherByLocation(currentCityInformation);

    }, function(error) {
        if(error.message == "User denied Geolocation"){
            alert("Please Enable Location");
        }
    });
});

const searchInput = document.getElementById("cityInput");
let citySearchTimer;
searchInput.addEventListener('keyup', function (event) {
    document.getElementById("cityBox").style.display = "none";
    document.getElementById("cityList").innerHTML = "";

    if(event.target.value.length > 0) {
        clearTimeout(citySearchTimer);
        citySearchTimer = setTimeout(() => doneTyping(event.target.value), 2000);
        return;
    }
    document.getElementById("cityBox").style.display = "none";
});

function doneTyping(tempCitySearch) {

    const fetchOption = {
        method: "GET"
    };

    fetch("./assets/js/city.list.json", fetchOption)
    .then(Response => Response.json())
    .then(data => {
        document.getElementById("cityList").innerHTML = "";
        const tempCities = data.filter(item => item.name.toLowerCase().includes(tempCitySearch.toLowerCase()));        
        let listToShow = document.getElementById("cityList");
        document.getElementById("cityBox").style.display = "block";

        if(tempCities.length > 0) {
            tempCities.forEach(item => {
                let cityItem = document.createElement("li");
                cityItem.setAttribute("id", `city-${item.id}`);
                //cityItem.setAttribute("onclick", `showWeatherInformation(${item.name}, ${item.id});`);
                //cityItem.onclick = showWeatherInformation(item.name, item.id);
                cityItem.onclick = () => showWeatherInformation(item.name, item.id);
                cityItem.innerText = item.name;
                listToShow.appendChild(cityItem);
            });
        } else {
            listToShow.innerHTML = "Sorry, the city was not found.";
        }
    })
    .catch(error => console.log(error));
}

async function findWatherByLocation(cityInformation) {
    const liveLocation = String(cityInformation.address.city).toLowerCase();
    
    const fetchOption = {
        method: "GET"
    };
    
    let liveLocationCity;
    await fetch("./assets/js/city.list.json", fetchOption)
    .then(Response => Response.json())
    .then(async data => {
        liveLocationCity = await data.filter(item => item.name.toLowerCase().includes(liveLocation));
        showWeatherInformation(liveLocationCity[0].name, liveLocationCity[0].id);
    })
    .catch(error => {
        showWeatherInformation("Dubai", 292224);
    });
}

function showWeatherInformation(cityName, cityId) {
    document.getElementById("cityInput").value = "";
    document.getElementById("cityList").innerHTML = "";
    document.getElementById("cityBox").style.display = "none";

    let dataToShow;

    const fetchOption = {
        method: "GET"
    };

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_WEATHER}`, fetchOption)
    .then(Response => Response.json())
    .then(async data => {
        dataToShow = await data;
        document.getElementById("cityName").innerText = dataToShow.name + ", " + dataToShow.sys.country;
        document.getElementById("mainTemp").innerText = String(Math.round(+dataToShow.main.temp - 273.15)) + " °C";
        document.getElementById("showRain").innerText = dataToShow.main.humidity + "%";
        document.getElementById("showPressure").innerText = dataToShow.main.pressure + "Pha";
        document.getElementById("todayName").innerText = dayOfWeek(dataToShow.dt * 1000);
        document.getElementById("showWind").innerText = getWindDirection(dataToShow.wind.deg, data.wind.speed);

        weatherImages.forEach(obj => {
            if(obj.ids.includes(dataToShow.weather[0].id)) {
                document.getElementById("tempImage").setAttribute("src", `${obj.url}`);
            }
        });

        getDays(dataToShow.id);
    })
    .catch(error => console.log(error));
}

function getDays(cityId) {
    let daily = [];

    fetch(`https://api.openweathermap.org/data/2.5/forecast?units=metric&appid=${API_WEATHER}&id=${cityId}`)
    .then(Response => Response.json())
    .then(data => {
        data.list.forEach(day => {
            let date = new Date(day.dt_txt.replace(' ', 'T'));
            let hours = date.getHours();
            if(hours === 12) {
                daily.push(day);
            }
        });

        document.getElementById("days").innerHTML = "";
        daily.forEach(day => {
            let iconUrl = 'http://openweathermap.org/img/wn/' + day.weather[0].icon + '@2x.png';
            let dayName = dayOfWeek(day.dt * 1000);
            let temperature = day.main.temp > 0 ? 
                        '+' + Math.round(day.main.temp) : 
                        Math.round(day.main.temp);
            let forecatItem = `
                <div>
                    <img src="${iconUrl}" alt="${day.weather[0].description}">
                    <span class="dayName">${dayName}</span>
                    <span class="tempDay">${temperature} °C</span>
                </div>
            `;
            document.getElementById("days").innerHTML += forecatItem;
        })

    })
    .catch(error => console.log(error));
}

let dayOfWeek = (dt = new Date().getTime()) => {
    return new Date(dt).toLocaleDateString('en-EN', {'weekday': 'long'});
}

function getWindDirection(windDeg, windSpeed) {
    let windDirection;
    if(windDeg > 45 && windDeg <= 135) {
        windDirection = 'East';
    } else if(windDeg > 135 && windDeg <= 225) {
        windDirection = 'South';
    } else if(windDeg > 225 && windDeg <= 315) {
        windDirection = 'West';
    } else {
        windDirection = 'North';
    }
    return windDirection + ', ' + windSpeed + "m/s";
}
