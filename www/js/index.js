/*
    phonegap plugin add https://github.com/hazems/cordova-sms-plugin.git
    phonegap plugin add cordova-plugin-sms
    phonegap plugin add cordova-sms-plugin
*/

var baseURL = 'http://legacy.dtelecom.ru/sending/';
var sendList = null;
var sendRUN  = false;

var app = {
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    onDeviceReady: function() {
        this.receivedEvent('deviceready');
    },

    receivedEvent: function(id) {
        this.addLog('Received Event: ' + id);
        $('#dbg_console').css('height','200px');
        app.loadSendList();
    },

    addLog: function (msg) {
        $('#dbg_console').append(msg+'\n');
    },

    sendSms: function(number, message, id) {
        this.addLog("sendSms number=" + number + ", message=" + message);

        var messageInfo = {
            phoneNumber: number,
            textMessage: message
        };

        sms.sendMessage(
            messageInfo,
            function (message) {
                app.setItemStatus(id, true);
                app.addLog("success: " + message);
            },
            function (error) {
                app.setItemStatus(id, false);
                app.addLog("code: " + error.code + ", message: " + error.message);

            }
        );
    },

    loadSendList: function () {
        $('#send_list').empty();

        cordova.plugin.http.post(baseURL+'rest_sms_get_list',{},{},
            function (resp) {
                $('.progress').css('width','0px');
                $('.progress').data('val', '0');
                app.addLog('Succ status:'+resp.status);
                sendList = JSON.parse(resp.data);
                if (sendList.length > 0) {
                    $(sendList).each(function (i, obj) {
                        $('#send_list').append(new Option(obj.title, i)).selectmenu("refresh");
                    });
                    $('#bnt_start').val('Начать рассылку').button('refresh');
                } else {
                    $('#bnt_start').val('Получить рассылки').button('refresh');
                    $('#send_list').append(new Option('Список рассылок пуст', 9999)).selectmenu("refresh");
                }
            },
            function (resp) {
                $('.progress').css('width','0px');
                $('.progress').data('val', '0');
                $('#bnt_start').val('Получить рассылки').button('refresh');
                $('#send_list').append(new Option('Список рассылок пуст', 9999)).selectmenu("refresh");
                app.addLog('Err status:'+resp.status);
                app.addLog('Err error:'+resp.error);
            }
        )
    },

    setItemStatus: function (i, is_send) {
        cordova.plugin.http.post(baseURL+'rest_sms_set_sended',{s:i, t:(is_send?'s':'f')},{},
            function (resp) {
                // app.addLog('setItemStatus finished:'+resp.data);

                if ( $('.progress').data('val') < parseInt(resp.data)){
                    $('.progress').css('width',resp.data+'%');
                    $('.progress').data('val',resp.data);
                }
                $('#status_'+i).text(is_send ? 'Отправлено' : 'Ошибка');
            },
            function (resp) {
                app.addLog('Err setItemStatus params:'+i);
                app.addLog('Err setItemStatus status:'+resp.status);
                app.addLog('Err setItemStatus error:'+resp.error);
            }
        )
    },

    StartSending : function (ext_call) {
        var it = $('#send_list').val();

        if (it == 9999) {
            app.loadSendList();
            return;
        }

        if (ext_call){
            sendRUN = !sendRUN;
            $('#bnt_start').val(sendRUN ? 'Остановить рассылку' : 'Начать рассылку').button('refresh');
        }
        if (sendRUN) {
            cordova.plugin.http.post(baseURL + 'rest_sms_get_items', {s: sendList[it].id}, {},
                function (resp) {
                    $('#send_items>tbody').empty();
                    var sendItems = JSON.parse(resp.data);
                    $(sendItems).each(function (i, obj) {
                        var phone = obj.ph;

                        if (phone.match(/^89/) != null){
                            phone = phone.replace(/^89/,'+79');
                        }

                        $('#send_items>tbody').append('<tr><td>' + phone + '</td><td id="status_' + obj.id + '">Ожидание</td>></tr>');
                        setTimeout(function () {
                            // For Debug
                            //app.setItemStatus(obj.id, true);
                            app.sendSms(phone, sendList[it].msg, obj.id);

                            if (sendItems.length == i + 1 && sendRUN) {
                                app.StartSending(false);
                            }
                        }, 2000);
                    });

                    if (sendItems.length == 0) {
                        alert('Рассылка окончена');

                        $('#bnt_start').val('Начать рассылку').button('refresh');
                        sendRUN = false;
                        app.loadSendList();
                    }
                },
                function (resp) {
                    app.addLog('Err items status:' + resp.status);
                    app.addLog('Err items error:' + resp.error);
                }
            );
        };
    }
};