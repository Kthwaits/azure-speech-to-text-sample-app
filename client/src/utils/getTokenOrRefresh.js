import axios from 'axios';

export async function getTokenOrRefresh() {
        try {
            const res = await axios.get('/api/get-speech-token');
            const token = res.data.token;
            const region = res.data.region;

            console.log('Token fetched from back-end: ' + token);
            return { authToken: token, region: region };
        } catch (err) {
            console.log(err.response.data);
            return { authToken: null, error: err.response.data };
        } 
}