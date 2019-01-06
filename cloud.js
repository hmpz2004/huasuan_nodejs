var AV = require('leanengine');

/**
 * 一个简单的云代码方法
 */
AV.Cloud.define('hello', function(request) {
  return 'Hello world!';
});

AV.Cloud.define('trans_hcapi', function(request) {
	var para = request.params.para;
	// console.log('req.params:');
	// console.log(request.params.para);

	var urlStr = "http://api.vephp.com/hcapi?vekey=V00000606Y32494568&para=" + para;

	var responseStr = '';

	var http=require('http');

	function requestUrl(para){

	    let re = ''; 
	    // var urlStr = "http://api.vephp.com/hcapi?vekey=V00000606Y32494568&para=" + para;
	    
	    return new Promise(function(resolve, reject) {
	        http.get(urlStr,(res)=>{
	            res.setEncoding('utf8');
	            let rawData = '';
	            res.on('data', (chunk) => {
	                // console.log('chunk ' + chunk);
	                rawData += chunk
	            });
	            res.on('end', () => {
	                re = rawData;
	                // console.log('before resolve ' + re);
	                resolve(re);
	            });
	        });
	    });
	};

	async function requestAndFetchResponse () {
	    let re = await requestUrl(para);
	    // console.log('http res : ' + re);
	    return re;
	}

	return requestAndFetchResponse();
});
AV.Cloud.define('trans_dec', function(request) {
	var para = request.params.para;

	var urlStr = "http://api.vephp.com/dec?vekey=V00000606Y32494568&para=" + para;

	var responseStr = '';

	var http=require('http');

	function requestUrl(para){

	    let re = '';
	    
	    return new Promise(function(resolve, reject) {
	        http.get(urlStr,(res)=>{
	            res.setEncoding('utf8');
	            let rawData = '';
	            res.on('data', (chunk) => {
	                // console.log('chunk ' + chunk);
	                rawData += chunk
	            });
	            res.on('end', () => {
	                re = rawData;
	                // console.log('before resolve ' + re);
	                resolve(re);
	            });
	        });
	    });
	};

	async function requestAndFetchResponse () {
	    let re = await requestUrl(para);
	    return re;
	}

	return requestAndFetchResponse();
});

AV.Cloud.define('alipay_bot_submit_user_info', function(request) {
    var para = request.params;
    
    var BuyerInfo = AV.Object.extend('BuyerInfo');
    
    // 先根据payerLoginId查下是否已经有账户了
    var queryBuyerInfo = new AV.Query('BuyerInfo');
    queryBuyerInfo.equalTo('payerLoginId', para.payerLoginId);
    queryBuyerInfo.find().then(function (results) {
        if (results && results.length !== 0) {
            // 已经存在数据
            let len = results.length;
            let oldRec = results[0];
            let oid = oldRec.id;
            console.log('query BuyerInfo.payerLoginId ' + para.payerLoginId + ' result id ' + oid);
            let needSave = false;
            if (para.buyerName) {
                needSave = true;
                oldRec.set('buyerName', para.buyerName);
            }
            if (needSave) {
                oldRec.save().then(function (res) {
                    console.log('updated BuyerInfo ' + oid);
                }, function (error) {
                    console.error('updated BuyerInfo ' + oid + ' ' + error);
                });
            }
        } else {
            // 不存在该数据，可以插入
            var buyerInfoObj = new BuyerInfo();
            buyerInfoObj.set('payerLoginId', para.payerLoginId);
            buyerInfoObj.set('buyerName', para.buyerName);
            if (para.tsId) {
                buyerInfoObj.set('tsId', para.tsId);
            }
            
            buyerInfoObj.save().then(function (res) {
                console.log('objectId is ' + res.id);
            }, function (error) {
                console.error(error);
            });
        }
    }, function (error) {
        console.error('query BuyerInfo.payerLoginId error ' + error);
    });
    
    var resObj = {
        statusCode : 0,
        tsId : para.tsId
    }
});

AV.Cloud.define('alipay_bot_submit_biz_callback', function(request) {
  
    var addFunc = function numAdd(num1, num2) {
       var baseNum, baseNum1, baseNum2;
       try {
           baseNum1 = num1.toString().split(".")[1].length;
       } catch (e) {
           baseNum1 = 0;
       }
       try {
           baseNum2 = num2.toString().split(".")[1].length;
       } catch (e) {
           baseNum2 = 0;
       }
       baseNum = Math.pow(10, Math.max(baseNum1, baseNum2));
       return (num1 * baseNum + num2 * baseNum) / baseNum;
    };

    var COLLECT_R = AV.Object.extend('COLLECT_R');
    var MERCHANT_CASH = AV.Object.extend('MERCHANT_CASH');
    
    var params = request.params;
    
    // console.log('params ' + JSON.stringify(params));
    
    if (params.biz == 'COLLECT-R') {
        // 已经扫码or已经输入完了密码并指纹确认了付款
        if (params.md && params.md.length !== 0) {
            
            var recsToSaveArray = [];
            
            for (let i = 0; i < params.md.length; i++) {
                var itempl = params.md[0].pl;
                
                itempl = JSON.parse(itempl);
                
                var collRToSave = new COLLECT_R();
                if (itempl.amount) {
                    collRToSave.set('amount', parseFloat(itempl.amount));
                    collRToSave.set('amountStr', itempl.amount);
                }
                collRToSave.set('payerLoginId', itempl.payerLoginId);
                collRToSave.set('payerSessionId', itempl.payerSessionId);
                collRToSave.set('payerUserId', itempl.payerUserId);
                collRToSave.set('payerUserName', itempl.payerUserName);
                collRToSave.set('sessionId', itempl.sessionId);
                collRToSave.set('state', itempl.state);
                if (itempl.transferNo) {
                    collRToSave.set('transferNo', itempl.transferNo);
                }
                collRToSave.set('userId', itempl.userId);
                
                recsToSaveArray.push(collRToSave);
            }
            
            // 批量存储
            AV.Object.saveAll(recsToSaveArray).then(function (objects) {
                console.log('save COLLECT-R ' + objects.length);
            }, function (error) {
                console.error('save COLLECT-R ' + error);
            });
        }
    } else if (params.biz == 'MERCHANT-CASH') {
        // 扫码付款已到账
        if (params.md && params.md.length !== 0) {
            
            var recsToSaveArray = [];
            
            for (let i = 0; i < params.md.length; i++) {
                var itempl = params.md[0].pl;
                
                itempl = JSON.parse(itempl);
                
                var merchantCashToSave = new MERCHANT_CASH();
                merchantCashToSave.set('buyerName',itempl.buyerName);
                merchantCashToSave.set('payTime',itempl.payTime);
                merchantCashToSave.set('receiptFee',parseFloat(itempl.receiptFee));
                merchantCashToSave.set('receiptFeeStr',itempl.receiptFee);
                merchantCashToSave.set('shakeId',itempl.shakeId);
                
                recsToSaveArray.push(merchantCashToSave);
            }
            
            // 批量存储到账数据
            AV.Object.saveAll(recsToSaveArray).then(function (objects) {
                console.log('save MERCHANT-CASH ' + objects.length);
                var curTimestamp = new Date().getTime();
                //<<>>
                // var ts60sAgo = curTimestamp - 600000 * 1000;
                // 目前只匹配2s以内的金额-到账数据
                var ts60sAgo = curTimestamp - 2 * 1000;
                var date60sAgo = new Date(ts60sAgo);
                
                objects.forEach(function (obj) {
                    var targetReceiptFee = obj.get('receiptFee');  // 根据到账金额查找短时间内预转账记录，查找对应的转账人
                    var targetBuyerName = obj.get('buyerName');    // 打码的付款人真名
                    var targetShakeId = obj.get('shakeId');
                    
                    var queryCOLLECT_R = new AV.Query('COLLECT_R');
                    queryCOLLECT_R.equalTo('amount', parseFloat(targetReceiptFee));
                    queryCOLLECT_R.equalTo('state', '1');
                    queryCOLLECT_R.greaterThan('createdAt', date60sAgo);    // 此处需要传入Date类型
                    queryCOLLECT_R.find().then(function (sameReceiptFeeResults) {
                        if (!sameReceiptFeeResults) {
                            console.log('query COLLECT_R ' + targetReceiptFee + ' got null');
                            return;
                        }
                        sameReceiptFeeResults.forEach(function (itemSameReceiptFeeResult) {
                            // 遍历处理每个预转账金额为targetReceiptFee的COLLECT_R中的记录
                            // 匹配这些记录的每个真名
                            var payerLoginIdToCmp = itemSameReceiptFeeResult.get('payerLoginId');
                            var payerUserIdToCmp = itemSameReceiptFeeResult.get('payerUserId');
                            var payerUserNameToCmp = itemSameReceiptFeeResult.get('payerUserName');
                            var transferNoToCmp = itemSameReceiptFeeResult.get('transferNo');
                            
                            // 找到payerLoginId的那条记录
                            var queryBuyerInfo = new AV.Query('BuyerInfo');
                            queryBuyerInfo.equalTo('payerLoginId', payerLoginIdToCmp);
                            queryBuyerInfo.find().then(function (payerLoginIdToCmpResults) {
                                if (!payerLoginIdToCmpResults || payerLoginIdToCmpResults.length === 0) {
                                    console.log('query BuyerInfo ' + payerLoginIdToCmp + ' got null');
                                    return;
                                }
                                var thePayerLoginIdRec = payerLoginIdToCmpResults[0];
                                var origBuyerName = thePayerLoginIdRec.get('buyerName');   // 真名全名
                                var origBalance = thePayerLoginIdRec.get('Balance');
                                var origPayerUserId = thePayerLoginIdRec.get('payerUserId');
                                var origNickName = thePayerLoginIdRec.get('nickName');
                                
                                // check真名与打码的名是否能对上
                                targetBuyerName = targetBuyerName.replace('*', '.*');   // *脆瓜 -> .*脆瓜
                                var regex = new RegExp(targetBuyerName,"g");
                                if (origBuyerName.match(regex)) {
                                    // 此处加法特殊处理一下，否则可能结果出现一长串小数
                                    var newBalance = parseFloat(addFunc(origBalance, targetReceiptFee));
                                    
                                    // 找到了匹配的预付款记录和账号信息
                                    // 修改用户表余额
                                    var updateBuyerInfo = new AV.Object.createWithoutData('BuyerInfo', thePayerLoginIdRec.id);
                                    updateBuyerInfo.set('Balance', newBalance); // 增加该用户的余额
                                    if (!origPayerUserId) {
                                        updateBuyerInfo.set('payerUserId', payerUserIdToCmp);
                                    }
                                    if (!origNickName) {
                                        // 昵称
                                        updateBuyerInfo.set('nickName', payerUserNameToCmp);
                                    }
                                    updateBuyerInfo.save();
                                    
                                    targetBuyerName = targetBuyerName.replace('.*', '*');   // .*脆瓜 -> *脆瓜
                                    
                                    // 插入一条trans记录
                                    var AlipayTransaction = AV.Object.extend('AlipayTransaction');
                                    var alipayTransToSave = new AlipayTransaction();
                                    alipayTransToSave.set('payerLoginId', payerLoginIdToCmp);
                                    alipayTransToSave.set('transType', 'charge');
                                    alipayTransToSave.set('amount', targetReceiptFee);
                                    alipayTransToSave.set('Balance', newBalance);
                                    alipayTransToSave.set('buyerName', origBuyerName);
                                    alipayTransToSave.set('markedBuyerName', targetBuyerName);
                                    alipayTransToSave.set('payerUserName', payerUserNameToCmp);
                                    alipayTransToSave.set('transferNo', transferNoToCmp);
                                    alipayTransToSave.set('shakeId', targetShakeId);
                                    alipayTransToSave.save();
                                }
                            }, function (error) {
                                console.error('query BuyerInfo ' + payerLoginIdToCmp + ' error ' + error);
                            });
                        });
                    }, function (error) {
                        console.error('query COLLECT_R.state 1 error ' + error);
                    });
                });
            }, function (error) {
                console.error('save MERCHANT-CASH ' + error);
            });
        }
    }
});

AV.Cloud.define('alipay_bot_submit_withdraw', function(request) {
  
    var subFunc = function numSub(num1, num2) {
       var baseNum, baseNum1, baseNum2;
       var precision;// 精度
       try {
           baseNum1 = num1.toString().split(".")[1].length;
       } catch (e) {
           baseNum1 = 0;
       }
       try {
           baseNum2 = num2.toString().split(".")[1].length;
       } catch (e) {
           baseNum2 = 0;
       }
       baseNum = Math.pow(10, Math.max(baseNum1, baseNum2));
       precision = (baseNum1 >= baseNum2) ? baseNum1 : baseNum2;
       return ((num1 * baseNum - num2 * baseNum) / baseNum).toFixed(precision);
    }

    var params = request.params;
    
    var payerLoginId = params.payerLoginId;
    var buyerName = params.buyerName;
    var amount = parseFloat(params.amount);
    
    var queryBuyerInfo = new AV.Query('BuyerInfo');
    queryBuyerInfo.equalTo('payerLoginId', payerLoginId);
    queryBuyerInfo.find().then(function (results) {
        if (!results || results.length === 0) {
            console.log('query BuyerInfo.payerLoginId got null');
            return;
        }
        var targetBuyerInfo = results[0];
        var payerLoginIdInRec = targetBuyerInfo.get('payerLoginId');
        var balanceInRec = targetBuyerInfo.get('Balance');
        console.log(payerLoginIdInRec + ' ' + balanceInRec);
        
        if (amount < balanceInRec) {
            // 提现金额小于余额，可以直接提现
            // 减法要特殊处理，否则出现一长串小数
            var newBalance = parseFloat(subFunc(balanceInRec, amount));
            targetBuyerInfo.set('Balance', newBalance);
            targetBuyerInfo.save().then(function(res) {
                
            },function(error) {
                console.error(error);
            });
            
            // 新增一条交易记录
            var AlipayTransaction = AV.Object.extend('AlipayTransaction');
            var transToSave = new AlipayTransaction();
            transToSave.set('payerLoginId', payerLoginId);
            transToSave.set('buyerName', buyerName);
            transToSave.set('transType', 'withdraw');
            transToSave.set('amount', amount);
            transToSave.set('Balance', newBalance);
            transToSave.save();
            
            AV.Push.send({
                channels: [ 'public' ],
                data: {
                    action: 'com.huasuan.leancloud.push_cmd_action',
                    account: payerLoginId,
                    money_amount: amount
                }
            });
        }
        
    }, function (error) {
        console.log('query BuyerInfo.payerLoginId error ' + error);
    });
});

AV.Cloud.define('alipay_bot_index', function(request) {
      var params = request.params;
    
    
    var curTimestamp = new Date().getTime();

    var hrTimeArray = process.hrtime();
    var nanoTimePostfix = parseInt(hrTimeArray[1]);
    
    var tsIdValue = curTimestamp.toString() + nanoTimePostfix.toString();
    
    if (!params.tsId) {
        // 当前用户可能为第一次访问本站
        // 或者用户没有使用分配给他的专属链接
        
        var resObj = {
            statusCode : 0, // 代表没有错误
            tsId : tsIdValue
        };
        
        return resObj;
    } else {
        // 当前用户的url带了tsId字段上来
        // 根据tsId查询用户loginId和真实姓名，返回至网页
        
        var resObj = {
            statusCode : 0, // 代表没有错误
            msg : "",
            tsId : "",
            payerLoginId : "",
            buyerName : "",
            balance : ""
        };
        
        var queryBuyerInfo = new AV.Query('BuyerInfo');
        queryBuyerInfo.equalTo('tsId', params.tsId);
        return queryBuyerInfo.find().then(function (results) {
            if (!results || results.length === 0) {
                console.log('query BuyerInfo.tsId got null');
                resObj.statusCode = 101;
                resObj.msg = "没有查到tsId对应的用户信息";
                resObj.tsId = tsIdValue;
                //<<>>
                console.log(resObj.tsId);
                return resObj;
            }
            var targetBuyerInfo = results[0];
            var payerLoginIdInRec = targetBuyerInfo.get('payerLoginId');
            var balanceInRec = targetBuyerInfo.get('Balance');
            var buyerNameInRec = targetBuyerInfo.get('buyerName');
            
            resObj.payerLoginId = payerLoginIdInRec;
            resObj.buyerName = buyerNameInRec;
            resObj.balance = balanceInRec;
            
            return resObj;
        }, function(error) {
            console.log('query BuyerInfo.tsId got error ' + error);
        });
    }
});
