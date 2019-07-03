// Catch all error

window.onerror = function myError(errorMsg, url, lineNumber) {
    app.addLog( 'act:'+errorMsg+' bv:'+navigator.userAgent+' url:'+url+' ln:'+lineNumber);

    return true;
}
