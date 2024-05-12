let geocoder
let map //地図
var mapElement = document.getElementById('map'); // 地図を描画する要素
var markers = []; // 検索結果(ピン)
var list = []; // 検索結果(リスト)

// 除外カテゴリを設定
var excludedTypes = ['bar'];
// 除外ワードを設定
var excludedWords = ['スナック', 'バー', 'サロン', 'BAR'];

// アクセス時
function initMap(){
  // フォームのデフォルト値設定
  // 日付
  let today = new Date()
  let now_date = today.toISOString().split('T')[0];
  document.getElementById('date').value = now_date;
  // 時刻
  let currentHours = today.getHours().toString().padStart(2, '0');
  let currentMinutes = "00";
  let currentTime = currentHours + ":" + currentMinutes;
  document.getElementById('time').value = currentTime;

  // マップの設定
  geocoder = new google.maps.Geocoder()

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        // 現在地
        const latitube = position.coords.latitude; //緯度
        const longitude = position.coords.longitude; //経度
        const latlng = new google.maps.LatLng(latitube, longitude); // {lat: , lng: }

        // 現在地を中心とした新規マップ
        map = new google.maps.Map(mapElement, {
          center: latlng,
          zoom: 15,
        });

      },
      function (error) {
        alert("現在地を取得できませんでした。");
      }
    );

  } else {
    alert("このブラウザは位置情報に対応していません。");
  }
}

// マップ検索時の処理
function codeAddress(){
  let inputAddress = document.getElementById('address').value;

  geocoder.geocode( { 'address': inputAddress}, function(results, status) {
    // 該当する検索結果がヒットした時に、地図の中心を検索結果の緯度経度に更新する
    if (status == 'OK') {
      map.setCenter(results[0].geometry.location);

      // document.getElementById('display').textContent = "緯度：" + results[ 0 ].geometry.location.lat() + ", 経度：" + results[ 0 ].geometry.location.lng()
    } else {
      // 検索結果が何もなかった場合に表示
      alert('該当する結果がありませんでした：' + status);
    }
  });
}

// 現在地取得
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
        // document.getElementById('display').textContent = "緯度：" + latitube + ", 経度：" + longitude
    });
  } else {
    alert("このブラウザは位置情報に対応していません。");
  }
}

// 店舗を取得
function getNearbyShops() {
  // マーカーをリセット
  if (markers && markers.length > 0) {
    // 各ピンをマップから削除
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
    // ピンを格納する配列を空にする
    markers = [];
  }
  // リストをリセット
  document.getElementById("list").innerHTML = "";

  if (validation() == true) {
    // 現在のマップの中心座標を取得
    var latitude = map.getCenter().lat();
    var longitude = map.getCenter().lng();

    // ＜検索条件＞
    // 指定した曜日を取得
    // 0: 日曜日, ..., 6: 土曜日
    var day = new Date(document.getElementById('date').value).getDay();
    console.log("曜日：" + day);
    // 指定した開始時間を取得
    var time = document.getElementById('time').value.replace(":", "");
    // カテゴリを取得
    var keywords = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach((checkbox) => {
      keywords.push(checkbox.value);
    });

    // ＜周辺検索＞
    // リクエストを作成
    var request = {
      location: { lat: latitude, lng: longitude },
      radius: '500', // 検索半径(m)
      maxResults: 30,
      // type:  // 対応しているカテゴリが限られているため使用しない
      keyword: keywords.join(' | ') // キーワードを結合して検索
    };

    // PlacesService オブジェクトを作成
    var service = new google.maps.places.PlacesService(map);

    // 検索リクエストを送信・結果を絞り込み(コールバック関数)
    service.nearbySearch(request, function(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        console.log("nearbyAearch");

        // カテゴリでフィルタリング
        var filteredResults = results.filter(function(place) {
          // console.log(place.name);
          var placeTypes = place.types;
          // console.log(placeTypes);
          for (var i = 0; i < excludedTypes.length; i++) {
            if (placeTypes.includes(excludedTypes[i])) {
              return false;
            }
          }
          return true;
        });
        
        // ＜各店舗について詳細情報を取得＞
        console.log("get detail");
        filteredResults.forEach(function(place) {
          // リクエストを作成
          var detailRequest = {
            placeId: place.place_id, // 店舗の Place ID
            fields: ['name', 'opening_hours', 'types', 'photos'] // 取得する情報の種類
          };

          service.getDetails(detailRequest, function(placeResult, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              console.log(placeResult);

              // 店舗詳細情報のハッシュを作成
              var placeInfo = getPlaceInfo(place, placeResult, day);
              console.log(placeInfo);

              // ＜指定条件すべてに当てはまる場合＞
              if (checkConditions(placeInfo, time) == true) {
                
                // ピンを立てる
                putPinOnMap(placeInfo, map);

                // リスト表示
                addToList(placeInfo);
              }
              
            } else {
              console.error('Failed to get place details:', status);
            }
          });

        });
        // detail取得終了

      } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        console.error('店舗が見つかりませんでした。', status);
        alert('店舗が見つかりませんでした。');
      } else {
        console.error('Places API request failed:', status);
      }

    });
    // 周辺検索終了
  }
}

// 情報ハッシュを作成
function getPlaceInfo(place, placeResult, day) {
  // カテゴリ
  var types = placeResult.types;
  // var strCategory= "";
  var categories = [];
  for (var key in types) {
    // strCategory += types[key] + " ";
    categories.push(types[key]);
  }

  // 営業時間
  var openingHours = placeResult.opening_hours;
  var openingTime = '';
  var closingTime = '';

  if (openingHours) {
    if (openingHours.weekday_text) {
      if (day in openingHours.weekday_text) {
        var text = openingHours.weekday_text[day];
        if(text.indexOf("24 時間営業") > -1) {
          console.log("24時間営業");
          openingTime = '0000';
          closingTime = '2400';
        } else if (text.indexOf("定休日") > -1) {
          console.log("定休日");
          openingTime = '';
          closingTime = '';
        } else {
          console.log("他");
          const pattern = /(\d{1,2})時(\d{2})分/g;
          const matches = text.match(pattern);
          openingTime = matches[0].replace(/時|分/g, "").padStart(4, '0');
          closingTime = matches[1].replace(/時|分/g, "").padStart(4, '0');
          if (closingTime[0]=='0') {
            let hours = parseInt(closingTime.substring(0, 2)) + 24;
            closingTime = hours.toString() + closingTime.substring(2);
          }
        }
      }
    } else if (openingHours.periods) {
      if (day in openingHours.periods) {

        if (openingHours.periods[day].open) {
          openingTime = openingHours.periods[day].open.time;
        } else {
          if (openingHours.periods[0].open) {
            openingTime = openingHours.periods[0].open.time;
          }
        }
  
        if (openingHours.periods[day].close) {
          closingTime = openingHours.periods[day].close.time;
          if (closingTime[0]=='0') {
            let hours = parseInt(closingTime.substring(0, 2)) + 24;
            closingTime = hours.toString() + closingTime.substring(2);
          }
        } else {
          if (openingHours.periods[0].close) {
            closingTime = openingHours.periods[0].close.time;
            if (closingTime[0]=='0') {
              let hours = parseInt(closingTime.substring(0, 2)) + 24;
              closingTime = hours.toString() + closingTime.substring(2);
            }
          }
        }
      }
    } 
  }

  if (placeResult.photos && placeResult.photos.length > 0) {
    // 写真が存在する場合、最初の写真を取得
    var photo = placeResult.photos[0];
    var photoUrl = photo.getUrl({ maxWidth: 300, maxHeight: 200 }); // サイズを指定してURLを取得
  } else {
    var photoUrl = '';
  }

  var placeInfo = {
    name: placeResult.name, //店舗名
    openingTime: openingTime,
    closingTime: closingTime,
    categories: categories,
    place_id: place.place_id,
    // position: placeResult.geometry.location, // 取得不可
    position: place.geometry.location,
    photo: photoUrl
  };

  return placeInfo;
}

// 指定条件に当てはまるかを判断
function checkConditions(placeInfo, time) {
  // 店舗名が指定したワードを含んでいたら除外
  for (var i = 0; i < excludedWords.length; i++) {
    if (placeInfo.name.includes(excludedWords[i])) {
      console.log("Contain excluded words");
      return false;
    }
  }

  // 開店時間、閉店時間の記載がないものは除外
  // if (placeInfo.openingTime == '' || placeInfo.closingTime == '') {
  //   return false;
  // }

  // 指定した時間内に営業していないものは除外
  if (placeInfo.openingTime > time || time > placeInfo.closingTime ) {
    // openingTime < time < closingTime
    console.log("Not open");
    return false;
  }

  return true;
}

// ハッシュを元にピン・情報ウィンドウを作成
function putPinOnMap(placeInfo, map) {
  // 情報ウィンドウを作成
  var contentString = '<div>' +
    '<p>' + placeInfo.name + '</p>' +
    '<p>' + placeInfo.openingTime + ' - ' + placeInfo.closingTime + '</p>' +
    // '<p><strong>Category:</strong> ' + strCategory + '</p>' +
    // '<p>Place ID:' + placeInfo.place_id + '</p>' +
    '</div>';

  var infowindow = new google.maps.InfoWindow({
    content: contentString
  });

  // ピンを作成
  var marker = new google.maps.Marker({
    position: placeInfo.position,
    map: map
    // icon: {url: '/img/marker.png'}
  });
  markers.push(marker);

  // ピンが表示されたときに情報ウィンドウを表示
  infowindow.open(map, marker);
}

// ハッシュを元にリストに追加
function addToList(placeInfo) {
  var newItem = document.createElement("div");
  newItem.classList.add("row", "list-item");
  newItem.innerHTML = `
    <div class="col-4 p-2">
      <img src="" class="img-fluid">
    </div>
    <div class="col-8">
      <h6 class="text-start p-1">名前</h6>
      <p class="text-start p-1">説明</p>
    </div>
    <div class="col-1"></div>
  `;
  // 名前・説明・画像を設定
  let name = placeInfo.name;
  let description = '営業時間：' + placeInfo.openingTime + ' - ' + placeInfo.closingTime;
  let photo = placeInfo.photo;
  
  newItem.querySelector("h6").textContent = name;
  newItem.querySelector("p").textContent = description;
  newItem.querySelector("img").src = photo;

  document.getElementById('list').appendChild(newItem);
}


function validation() {
  let isChecked = false;
  document.querySelectorAll('input[type="checkbox"]').forEach(function(checkbox) {
      if (checkbox.checked) {
        isChecked = true;
      }
  });

  if (!isChecked) {
      alert("カテゴリを1つ以上選択して下さい。");
      return false;
  } else {
    return true;
  }
}