let map
let geocoder
const display = document.getElementById('display') // 表示領域
const date = document.getElementById('date') // 日付
var mapElement = document.getElementById('map');

// ＜アクセス時＞
function initMap(){
  geocoder = new google.maps.Geocoder()

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        // 現在地
        const latitube = position.coords.latitude; //緯度
        const longitude = position.coords.longitude; //経度
        const latlng = new google.maps.LatLng(latitube, longitude);

        // 現在地を中心とした新規マップ
        map = new google.maps.Map(mapElement, {
          center: latlng,
          zoom: 15,
        });

      },
      function (error) {
        alert("error");
      }
    );

  } else {
    alert("位置情報に対応していません。");
  }
}

// ＜現在地取得＞
function moveToCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        // 現在地
        const latitube = position.coords.latitude;
        const longitude = position.coords.longitude;
        const latlng = new google.maps.LatLng(latitube, longitude);

        // 現在地を中心とした新規マップ
        map.setCenter(latlng);

        // 画面に表示
        display.textContent = "緯度：" + latitube + ", 経度：" + longitude
    });
  } else {
    alert("位置情報に対応していません。");
  }
}

// ＜店舗を取得＞
function getNearbyShops() {
  // 現在のマップの中心座標を取得
  var latitude = map.getCenter().lat();
  var longitude = map.getCenter().lng();

  // 指定した曜日を取得(本日とする)
  var day = new Date().getDay();
  // 利用開始時間
  var time_start = 1700;
  // 利用終了時間
  var time_end = 2000;

  // 指定したカテゴリ
  var keywords = ['イタリアン'];
  // 除外するカテゴリ
  var excludedTypes = ['bar'];
  
  // リクエストを作成
  var request = {
    location: { lat: latitude, lng: longitude },
    radius: '500', // 検索半径(m)
    keyword: keywords.join('|') // キーワードを結合して検索
  };

  // PlacesService オブジェクトを作成
  var service = new google.maps.places.PlacesService(map);

  // 検索リクエストを送信・結果を絞り込み
  service.nearbySearch(request, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      
      // 各店舗について詳細情報を取得
      results.forEach(function(place) {
        // 指定した条件に当てはまるか
        var flg = true;

        // リクエストを作成
        var detailRequest = {
          placeId: place.place_id, // 店舗の Place ID
          fields: ['name', 'opening_hours', 'types'] // 取得する情報の種類
        };

        service.getDetails(detailRequest, function(placeResult, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            // 開店時間と閉店時間を取得
            var openingHours = placeResult.opening_hours;
            var openingTime = '';
            var closingTime = '';
            if (openingHours && openingHours.periods) {
              if (openingHours.periods[day].open) {
                openingTime = openingHours.periods[day].open.time;
              } else if (openingHours.periods[0].open) {
                openingTime = openingHours.periods[0].open.time;
              }
              if (openingHours.periods[day].close) {
                closingTime = openingHours.periods[day].close.time;
                if (closingTime[0]=='0') {
                  let hours = parseInt(closingTime.substring(0, 2)) + 24;
                  closingTime = hours.toString() + closingTime.substring(2);
                }
              } else if (openingHours.periods[0].close) {
                closingTime = openingHours.periods[0].close.time;
                if (closingTime[0]=='0') {
                  let hours = parseInt(closingTime.substring(0, 2)) + 24;
                  closingTime = hours.toString() + closingTime.substring(2);
                }
              }
            }

            // 指定した時間内に営業していないものは除外
            if (openingTime > time_start || time_end > closingTime ) {
              flg = false;
            }

            // 指定条件すべてに当てはまる場合、コンソールに表示
            if (flg == true) {
              console.log(placeResult.name + ', 営業時間：' + openingTime + '-' + closingTime);
              
              // マップにピン立てる処理など
            }
            
          } else {
            console.error('Failed to get place details:', status);
          }
        });

      });
      
    } else {
      console.error('Places API request failed:', status);
    }

  });
}