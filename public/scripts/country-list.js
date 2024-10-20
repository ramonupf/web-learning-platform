// Fetch the country list and populate the dropdown
fetch('/data/country_codes.json')
    .then(response => response.json())
    .then(countries => {
        const countrySelect = document.getElementById('country');

        // Loop through each country in the list
        countries.forEach(country => {
            // Create a new option element
            const option = document.createElement('option');
            option.value = country.Code; // Country code as the value
            option.textContent = country.Name; // Country name as the display text

            // Add the option to the select element
            countrySelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error fetching country data:', error);
    });
