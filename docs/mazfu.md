页面跳转支付
此接口可用于用户前台直接发起支付，使用 form 表单跳转或拼接成 URL 跳转。

请求地址
POST /xpay/epay/submit.php

请求参数
字段名	变量名	必填	类型	示例值	描述
商户ID	pid	是	String	1001	商户的唯一标识符
支付方式	type	是	String	alipay	支付方式列表(alipay/wxpay)
商户订单号	out_trade_no	是	String	20160806151343349	商户系统内部的订单号
异步通知地址	notify_url	否	String	http://www.pay.com/notify_url.php	服务器异步通知地址
跳转通知地址	return_url	否	String	http://www.pay.com/return_url.php	页面跳转通知地址
商品名称	name	是	String	VIP	商品的名称 如超过 127 个字节会自动截取
商品金额	money	是	String	1	商品的金额，单位为元，最多保留两位小数
网站名称	sitename	否	String	测试网站	网站名称
业务扩展参数	param	否	String	没有请留空	支付后原样返回
用户IP地址	clientip	否	String	192.168.1.100	用户发起支付的IP地址
设备类型	device	否	String	pc	用户所使用的浏览器或设备类型，默认为pc
支付渠道ID	channel_id	否	Uint	1	手动指定支付渠道ID
签名字符串	sign	是	String	202cb962ac59075b964b07152d234b70	签名算法点此查看
签名类型	sign_type	否	String	MD5	默认为MD5
返回结果
用户前台可使用 form 表单提交或拼接成 URL 进行跳转支付。


API接口支付
此接口用于服务器后端发起支付请求，并返回支付二维码链接或支付跳转URL。

请求地址
POST /xpay/epay/mapi.php

请求参数
字段名	变量名	必填	类型	示例值	描述
字段名	变量名	必填	类型	示例值	描述
------------	------------	----	------	---------------------------------	--------------------------------------
商户ID	pid	是	String	1001	商户的唯一标识符
支付方式	type	是	String	alipay	支付方式列表(alipay/wxpay)
商户订单号	out_trade_no	是	String	20160806151343349	商户生成的唯一订单号
异步通知地址	notify_url	否	String	http://www.pay.com/notify_url.php	服务器异步通知地址
跳转通知地址	return_url	否	String	http://www.pay.com/return_url.php	页面跳转通知地址
商品名称	name	是	String	VIP会员	商品的名称
商品金额	money	是	String	1	商品的金额，单位为元，最多保留两位小数
用户IP地址	clientip	否	String	192.168.1.100	用户发起支付的IP地址
设备类型	device	否	String	pc	用户所使用的浏览器或设备类型，默认为pc
业务扩展参数	param	否	String	没有请留空	支付后原样返回
支付渠道ID	channel_id	否	Uint	1	手动指定支付渠道ID
签名字符串	sign	是	String	202cb962ac59075b964b07152d234b70	签名算法点此查看
签名类型	sign_type	否	String	MD5	默认为MD5
返回结果
返回结果为JSON格式，包含以下字段：

字段名	变量名	类型	示例值	描述
返回状态码	code	Int	1	1表示成功，其他值表示失败
返回信息	msg	String	失败时返回原因	
订单号	trade_no	String	20160806151343349	支付订单号
支付跳转URL	payurl	String	https://pay.com/pay/wxpay/202010903/ 如果返回该字段，则直接跳转到该URL支付	
二维码链接	qrcode	String	weixin://wxpay/bizpayurl?pr=04IPMKM 如果返回该字段，则根据该URL生成二维码	
小程序跳转URL	urlscheme	String	weixin://dl/business/?ticket=xxx 如果返回该字段，则使用JS跳转该URL，可发起微信小程序支付	
支付金额	money	String	100.00	支付金额，单位为元
注：payurl、qrcode、urlscheme三个参数只会返回其中一个。


支付结果通知
通知类型：服务器异步通知（notify_url）、页面跳转通知（return_url）

请求方式：GET/POST

请求参数说明：

字段名	变量名	必填	类型	示例值	描述
商户ID	pid	是	Int	1001	商户的唯一标识符
易支付订单号	trade_no	是	String	20160806151343349021	易支付订单号
商户订单号	out_trade_no	是	String	20160806151343349	商户系统内部的订单号
支付方式	type	是	String	alipay	支付方式列表
商品名称	name	是	String	VIP会员	商品的名称
商品金额	money	是	String	1	商品的金额，单位为元，最多保留两位小数
支付状态	trade_status	是	String	TRADE_SUCCESS	只有TRADE_SUCCESS是成功
业务扩展参数	param	否	String		支付后原样返回
签名字符串	sign	是	String	202cb962ac59075b964b07152d234b70	签名算法点此查看
签名类型	sign_type	是	String	MD5	默认为MD5
收到异步通知后，需返回success以表示服务器接收到了订单通知。


MD5签名算法
1、将发送或接收到的所有参数按照参数名ASCII码从小到大排序（a-z），sign、sign_type、和空值不参与签名！

2、将排序后的参数拼接成URL键值对的格式，例如 a=b&c=d&e=f，参数值不要进行url编码。

3、再将拼接好的字符串与商户密钥KEY进行MD5加密得出sign签名参数，sign = md5 ( a=b&c=d&e=f + KEY ) （注意：+ 为各语言的拼接符，不是字符！），md5结果为小写。

4、具体签名与发起支付的示例代码可下载SDK查看。


支付方式列表
调用值	描述
alipay	支付宝
wxpay	微信支付
qqpay	QQ钱包
bank	网银支付
jdpay	京东支付
paypal	PayPal


设备类型列表
调用值	描述
pc	电脑浏览器
mobile	手机浏览器
qq	手机QQ内浏览器
wechat	微信内浏览器
alipay	支付宝客户端