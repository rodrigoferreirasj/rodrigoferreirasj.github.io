
const crypto = require('crypto');

const PEPPER = "o-r4iFnVs6B8$Qm+Jc@F7^ZL#hD2P!";

function gerarChave(email, appName) {
    const emailHash = crypto.createHash('sha256').update(email).digest('hex');
    const emailPart = emailHash.substring(0, 16);
    const combinado = (emailPart + appName).split('').reverse().join('');
    const hmacFull = crypto.createHmac('sha256', PEPPER).update(combinado).digest();
    const hmacTruncado = hmacFull.subarray(0, 12);
    return hmacTruncado.toString('base64url');
}

function validarChave(email, appName, chaveRecebida) {
    const chaveEsperada = gerarChave(email, appName);
    return chaveRecebida === chaveEsperada;
}
