const axios = require('axios');
const WSSE = require('wsse');

const parseError = (e) => {
    const {data} = e.response;
    const {message} = data;
    if(data.errors)
        return {message, errors: data.errors};

    return {message: data.error.message, error: data.error};
};

(async() => {

    const config = {
        key: 'ztfqG7J7twpqLqn4EtTRJrDVwmGuMuGn',
        secret: 'ekni8pKUHzNbxq7vVXmgZDEweZ9DXdvH',
        url: 'https://secure-sandbox.zaffo.com/api/1.0',
        service: 'skillballer'
    };
    const request = axios.create({
        baseURL: config.url,
        headers: {
            Authorization: `Token ${config.key}`,
        },
    });

    const game_id = 'little-lottery';
    const data = {
        amount: 1,
        currency: 'GBP',
        qty: 1,
        frequency: 'Once',
        is_recurring: false,
        customer: {
            email: 'haroldx3m.dev@gmail.com',
            phone: '',
            first_name: 'Harold',
            last_name: 'Pogi',
        },
        options: {
            is_subscribed_email: false,
            is_subscribed_phone: false,
        },
        tickets: ['123456'],
    }

    const salesTotal = await request.post(`/client/sales/total/${game_id}.json`, {
        qty: data.qty,
        frequency: data.frequency,
    }).then(result => result.data)
        .catch(error => {throw parseError(error);});

    const salesValidate = await request.post(`/client/sales/validate/${game_id}.json`, data)
        .then(result => result.data)
        .catch(error => {throw parseError(error);});
    console.log('Signature: ', salesValidate.signature);
    console.log('Transaction ID: ', salesValidate.transaction_id);


    const transactionData = Object.assign({}, data, {
        transaction_id: salesValidate.transaction_id,
        service: config.service,
        payment: {
            amount: data.amount,
            currency: data.currency,
            service: config.service,
            reference: new Date().getTime().toString(),
            payment_id: new Date().getTime().toString(),
            transaction_id: salesValidate.transaction_id,
            is_settled: true,
        }
    });
    const token = new WSSE.UsernameToken({
        username: config.key,
        password: config.secret,
        created: new Date(new Date() - 10).toISOString(),
        sha1encoding: 'hex',
    });

    const xwsse = token.getWSSEHeader({ nonceBase64: true });
    // console.log('token: ', token);
    console.log('\nx-wsse: ', xwsse);
    const request2 = axios.create({
        baseURL: config.url,
        headers: {
            'Content-Type': 'application/json',
            'x-wsse': xwsse,
        },
    });

    let transactionResult;
    try {
        transactionResult = await request2.post('/sales/default/create.json', transactionData);
    }
    catch(error){
        transactionResult = {error: {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
        }};
    }

    console.log('\nCreate Transaction Result: ', transactionResult);
    console.log();
})();
