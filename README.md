#mechat

**安装步骤**
> 1、克隆代码到本地<br/>
```php
git clone https://git.oschina.net/buexplain/laravel-rbac.git
```
2、执行安装命令<br/>
```php
cd laravel-rbac && composer install
```
3、修改数据库配置<br/>
```php
vi .env
```
4、运行迁移<br/>
```php
php artisan migrate
```
5、运行数据填充<br/>
```php
php artisan db:seed
```
6、启动内置服务器
```php
php artisan serve
```
7、浏览器访问
```php
http://localhost:8000/admin/signin
```

**License**
[MIT license](http://opensource.org/licenses/MIT)