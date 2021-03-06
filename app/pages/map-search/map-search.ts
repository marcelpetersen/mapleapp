import {ModalController, LoadingController, Events, AlertController, Popover, ActionSheet, MenuController, Platform, NavController, NavParams, Page, ViewController} from 'ionic-angular';
import {Geolocation} from 'ionic-native';
import { NgZone, Component, ElementRef, ViewChild} from '@angular/core';;
import {Connectivity} from '../../providers/connectivity/connectivity';
import {HouseDetailPage} from '../house-detail/house-detail';
import {HouselistSearch} from '../houselist-search/houselist-search';
import {MapleConf} from '../../providers/maple-rest-data/maple-config';
import {MapleRestData} from '../../providers/maple-rest-data/maple-rest-data';
import {Observable} from 'rxjs/Observable';
//import {GoogleMaps} from '../../providers/google-maps/google-maps';
import {SelectOptionModal} from './map-option-modal';
import {MapHouselist} from './map-houselist';
//import {ConferenceData} from '../../providers/conference-data';
import {SchoolSelectOptionModal} from '../school-map/schoolmap-option-modal';
import {SchoolListModal} from '../school-map/school-list-modal';
declare var RichMarker: any;
declare var google;

// interface selectOptionsObj {
//   selectPrice?: String,
//   selectType?: Number,
//   selectBeds?: Number,
//   selectBaths?: Number,
//   selectSR?: Boolean,
//   selectHousesize?: String,
//   selectLandsize?: String,
//   selectListType?: Boolean,
//   selectDate?: Number
// }
// interface schoolSelectOptionsObj {
//   selectType?: Boolean,
//   selectRank?: Number,
//   selectPingfen?: Number,
//   selectXingzhi?: String
// }

@Component({
  templateUrl: 'build/pages/map-search/map-search.html',
  // providers: [GoogleMaps]
})


export class MapSearchPage {

  @ViewChild('map') mapElement: ElementRef;

  private queryText: String = '';
  mapInitialised: boolean = false;
  mapLoaded: any;
  mapLoadedObserver: any;
  private cityItems: any;
  private addressItems: any;
  private mlsItems: any;
  private schoolItems: any;
  private parms: Object;
  private defaultcenter = new google.maps.LatLng(43.6532, -79.3832);
  private houselist: any;
  private map = null;
  private center;
  private markerArray = [];
  private htmlArray = [];
  private mviewLoaded: Boolean = false;
  private htmlArrayPosition = 0;
  private totalCount: Number; //Returned House
  private listAllHtml = ''; //hold houses on current map
  public isListShow: boolean = false;
  private markerType;
  private imgHost: String;
  private listModal: ViewController;
  private defaultZoom: Number = 14;
  private _bounds;

  private schoolList: Array<any>;
  private swiperOptions = {
    //loop: true,
    //pager: true,
    //speed: 4000,
    spaceBetween: 20,
    slidesPerView: 'auto',
    //loopedSlides: 10
    autoplay: 3000
  };
  // private selectOptions = {
  //   selectSR: true,
  //   selectBaths: 0,
  //   selectBeds: 0,
  //   selectHousesize: { lower: 0, upper: 4000 },
  //   selectLandsize: { lower: 0, upper: 43560 },
  //   selectPrice: { lower: 0, upper: 600 },
  //   selectType: '',
  //   selectListType: true,
  //   selectDate: 0

  // }
  private selectOptions;
  private optionPage;



  private currentHouseList; //Hold list of all houses on current map
  private currentHouses; //Hold array of houses for single marker

  private currentDiv;
  private mapType: Number = 1; // 0 for house and 1 for school

  constructor(
    public nav: NavController,
    public platform: Platform,
    private mapleRestData: MapleRestData,
    public connectivityService: Connectivity,
    private menu: MenuController,
    private mapleconf: MapleConf,
    private navparm: NavParams,
    private _zone: NgZone,
    private viewCtrl: ViewController,
    private alertc: AlertController,
    private modalc: ModalController,
    private loadingc: LoadingController,
    private events: Events
  ) {

    this.resetItems();
    //this.listenEvents(); //listen School map event
    //console.log(this.navparm.data);




  }



  initMap() {

    this.mapInitialised = true;
    //let mapEle = document.getElementById('map');
    this.mapleconf.getLocation().then(data => {
      this.defaultcenter = new google.maps.LatLng(data['lat'], data['lng']);

      // Geolocation.getCurrentPosition().then((position) => {

      //let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      // console.log("initmap:" + this.navparm['lat']);
      if (this.navparm.data.lat > 20) {
        console.log("Redirect from other page with center");
        this.defaultcenter = new google.maps.LatLng(this.navparm.data.lat, this.navparm.data.lng);
      }


      let mapOptions = {
        //center: latLng,
        center: this.defaultcenter,
        minZoom: 4,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_LEFT
        },
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_TOP
        },
        scaleControl: true,
        streetViewControl: true,
        streetViewControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT
        },
        zoom: 14,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }

      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

      google.maps.event.addListener(this.map, 'idle', () => { this.changeMap(this.mapType); });



      //Add marker if it's redirected from school page
      if (this.navparm.data.type != '') {
        console.log("SChool page switch over")
        this.setLocation(this.defaultcenter, 13, this.navparm.data.type)
      }


    });


  }



  ngAfterViewInit(): void {
    let mapLoaded = this.initMap();
    console.log("NG Afterviewinit")
  }


  ionViewWillEnter() {
    console.log("Mappage will enter");

  }

  ionViewDidEnter() {
    console.log("Mappage did enter");
  }

  ionViewDidLeave() {
    console.log("Mappage Did Leave");
  }

  ionViewWillLeave() {
    console.log("Mappage will Leave");
  }

  ionViewWillUnload() {
    console.log("Mappage will Unload");
  }

  //change center if school is selected from school map page
  // listenEvents() {
  //   this.events.subscribe('map:center', (data) => {
  //     this.mviewLoaded = true;
  //     let center = data[0];
  //     setTimeout(() => {

  //       this.nav.pop();//pop house detail page
  //       let marker = new google.maps.Marker({
  //         position: center,
  //         map: this.map,
  //         draggable: false,
  //       });
  //       this.setLocation(center, this.defaultZoom, true);
  //     }, 50);

  //   });
  //   this.events.subscribe('schoolmap:center', (data) => {
  //     setTimeout(() => {
  //       this.nav.pop();
  //     }, 50);
  //   });
  // }

  openModal() {
    let modal = this.modalc.create(this.optionPage, { data: this.selectOptions });
    modal.onDidDismiss(data => {
      this.selectOptions = data;
      this.changeMap(this.mapType);

    });
    modal.present();

  }


  getResult(url) {
    this.mapleRestData.load(url, this.parms).subscribe(
      data => { this.houselist = data.Data; }

    )
  }




  gotoHouseDetail(mls) {
    this.nav.push(HouseDetailPage, { id: mls, list: this.currentHouseList });
  }

  openHouseList(ev) {

    if ((this.markerType == 'house') && (this.totalCount > 0)) {
      //this.nav.push(MapHouselist, { list: this.currentHouseList, imgHost: this.imgHost })
      let modal = this.modalc.create(MapHouselist, { list: this.currentHouseList, imgHost: this.imgHost });
      modal.onDidDismiss(data => {
        //this.selectSchool = data;

      });
      modal.present();

    } else {

      //this.nav.push(HouselistSearch, { opts: this.selectOptions, bounds: this._bounds });
      let modal = this.modalc.create(HouselistSearch, { opts: this.selectOptions, bounds: this._bounds });
      modal.onDidDismiss(data => {
        //this.selectSchool = data;

      });
      modal.present();


    }
  }

  //select autocomplete action
  resetItems() {
    this.cityItems = [];
    this.addressItems = [];
    this.mlsItems = [];
    this.schoolItems = [];


    if (this.mapType == 0) {
      //init house page parm
      this.selectOptions = {
        selectSR: true,
        selectBaths: 0,
        selectBeds: 0,
        selectHousesize: { lower: 0, upper: 4000 },
        selectLandsize: { lower: 0, upper: 43560 },
        selectPrice: { lower: 0, upper: 600 },
        selectType: '',
        selectListType: true,
        selectDate: 0

      }
      this.optionPage = SelectOptionModal;
    } else {
      //init school map parm
      this.selectOptions = {
        selectPingfen: 0,
        selectRank: 0,
        selectType: false,
        selectXingzhi: ''

      }
      this.optionPage = SchoolSelectOptionModal;
    }



  }


  itemTapped(item) {

    let center = new google.maps.LatLng(item.lat, item.lng);
    this.currentDiv = '';
    this.queryText = '';
    console.log("Set Center and clear text");
    this.setLocation(center, this.defaultZoom, true);

  }
  //auto complete REST CAll
  searchFocus() {
    console.log("Search box is focused");
    this.queryText = '';
  }
  getItems(ev) {

    this.resetItems();
    let val = ev.target.value;

    if (val && val.trim() != '') {
      this.currentDiv = 'searchlist';
      //Call REST and generate item object
      this.mapleconf.load().then(data => {
        let restUrl = data.getCitylistDataRest;
        if (this.mapType == 1) {
          restUrl = data.getSchoolAcDataRest
        }
        this.mapleRestData.load(restUrl, { term: val }).subscribe(

          data => {
            if (data.hasOwnProperty("CITY")) {
              this.cityItems = data.CITY;

            };

            if (data.hasOwnProperty("MLS")) {
              this.mlsItems = data.MLS;

            }
            if (data.hasOwnProperty("ADDRESS")) {
              this.addressItems = data.ADDRESS;

            }
            if (data.hasOwnProperty("SCHOOL")) {
              this.schoolItems = data.SCHOOL;

            }

          }); //end of callback

        //}
      })
    }
  }

  //SetCenter and Zoom if location button is clicked
  setCenter(isMarker) {
    this.mapleconf.getLocation().then(data => {
      this.defaultcenter = new google.maps.LatLng(data['lat'], data['lng']);
      // this.setLocation(this.defaultcenter, this.defaultZoom, isMarker);
      this.setLocation(this.defaultcenter, this.defaultZoom, isMarker);
    })
  }

  // //Move to center and creata a marker
  setLocation(center, zoom, isMarker) {

    this.map.setZoom(zoom);
    this.map.setCenter(center);
    if (isMarker) {
      let marker = new google.maps.Marker({
        position: center,
        map: this.map,
        draggable: false,
      });
    }
  }


  setContent(lat, lng, count, html, houses, price, mls) {
    let point = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
    //let content = this.setMarkerCss(count, price);
    console.log("Set House Content Marker")
    let content = this.mapleconf.setHouseMarkerCss(count, price);
    let marker = new RichMarker({
      position: point,
      map: this.map,
      draggable: false,
      content: content,
      flat: true
    });
    this.markerArray.push(marker);


    marker.addListener('click', () => {
      if (count == 1) {
        let alert = this.alertc.create({
          //title: 'Confirm purchase',
          message: html,
          cssClass: 'house_popup',
          buttons: [
            {
              text: '取消',
              role: 'cancel',

            },
            {
              text: '详情',
              handler: () => {
                let navTransition = alert.dismiss();
                navTransition.then(() => {
                  this.nav.pop();
                  this.nav.push(HouseDetailPage, { id: mls, list: this.currentHouseList });
                  //this.nav.push(HouseDetailPage, mls); 
                });
                return false;
              }
            }
          ]
        });
        // this.nav.present(alert);
        alert.present();
      } else {
        console.log("More than one");
        // this.listModal = Modal.create(MapHouselist, { list: houses, imgHost: this.imgHost });
        // this.nav.present(this.listModal);
        this.nav.push(MapHouselist, { list: houses, imgHost: this.imgHost });


      }


    });


  }
  setSchoolContent(lat, lng, html, rating) {
    console.log("Set School Marker Content")
    let point = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
    let content = this.mapleconf.setSchoolMarkerCss(rating);
    let marker = new RichMarker({
      position: point,
      map: this.map,
      draggable: false,
      content: content,
      flat: true
    });
    this.markerArray.push(marker);

    marker.addListener('click', () => {

      let alert = this.alertc.create({
        title: '学校简介',
        message: html,
        cssClass: 'school_popup',
        buttons: [{ text: '取消', role: 'cancel' },
          {
            text: '周边房源',
            handler: () => {
              this.events.publish('map:center', { lat: lat, lng: lng, type: 'SCHOOL' });
              // this.events.publish('map:center', point);
              //this.nav.push(MapSearchPage, { lat: lat, lng: lng });
            }
          }
        ]
      });
      alert.present();
      //   //infowindow.open(this.map, marker);
    });


  }
  //set grid and city marker
  setContentCount(lat, lng, totalCount, city, number) {
    //let content = "<i class='icon_map_mark'><span>" + totalCount + "</span></i>";
    let point = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
    let content = '';
    if (this.mapType == 1) {
      content = this.mapleconf.setSchoolMarkerCss(number); //default color
    } else {
      content = this.mapleconf.setHouseMarkerCss(totalCount, number); //default color
    }


    let marker = new RichMarker({
      position: point,
      map: this.map,
      draggable: false,
      content: content,
      flat: true
    });


    this.markerArray.push(marker);
    google.maps.event.addListener(marker, 'click', function () {
      this.map.setCenter(this.position);
      let currentzoom = this.map.getZoom();
      this.map.setZoom(currentzoom + 2);
    });


  }
  //clear marker when map changed
  clearAll() {
    if (this.markerArray) {
      for (let i in this.markerArray) {
        this.markerArray[i].setMap(null);
      }
      this.markerArray.length = 0;
    }

    this.htmlArray = [];
    this.htmlArrayPosition = 0;

  }



  changeMap(type) {
    console.log("Change Map");
    //google.maps.event.trigger(this.map, 'resize');
    this.currentDiv = ''; //reset all popup
    // let loading = Loading.create({
    let loading = this.loadingc.create({
      content: '加载数据...'
    });
    // this.nav.present(loading);
    loading.present();

    this.clearAll(); //clear marker



    let gridSize = 60;	//60px
    //get element size to calcute number of grid
    let mapHeight = window.innerHeight;
    let mapWidth = window.innerWidth;
    let gridx = Math.ceil(mapWidth / gridSize);
    let gridy = Math.ceil(mapHeight / gridSize);
    let _sw = this.map.getBounds().getSouthWest();
    let _ne = this.map.getBounds().getNorthEast();
    let centerlat = (_ne.lat() + _sw.lat()) / 2;
    let centerlng = (_ne.lng() + _sw.lng()) / 2;
    let HouseArray = [];

    let marker;
    let mapParms;
    this._bounds = _sw.lat() + "," + _sw.lng() + "," + _ne.lat() + "," + _ne.lng();
    if (type == 1) {
      mapParms = {
        bounds: this._bounds,
        gridx: gridx,
        gridy: gridy,
        type: this.selectOptions.selectType,
        rank: this.selectOptions.selectRank,
        xingzhi: this.selectOptions.selectXingzhi,
        pingfen: this.selectOptions.selectPingfen


      };
    } else {
      mapParms = {
        bounds: this._bounds,
        gridx: gridx,
        gridy: gridy,
        sr: (this.selectOptions.selectSR == true) ? 'Sale' : 'Lease',
        housetype: this.selectOptions.selectType,
        houseprice: this.selectOptions.selectPrice,
        houseroom: this.selectOptions.selectBeds,
        housearea: this.selectOptions.selectHousesize,
        houseground: this.selectOptions.selectLandsize,
        housedate: this.selectOptions.selectDate

      };
    }

    //console.log("Map House Search Parms:" + mapParms);
    this.mapleconf.load().then(data => {

      let restUrl = data.mapHouseRest;
      if (type == 1) {
        restUrl = data.getSchoolmapDataRest
      }
      this.mapleRestData.load(restUrl, mapParms).subscribe(
        data => {
          loading.dismiss();
          if (type == 0) {
            this.processHouseData(data);
          } else {
            this.processSchoolData(data);
          }


        },
        error => {

          this.restError(loading);
        }
      );

      //END of Data Subscribe
    })
  }

  restError(loading) {
    loading.dismiss().then(res => this.presentError());
  }
  presentError() {
    let alert = this.alertc.create({
      title: '警告',
      message: '数据装载超时，重试?',
      buttons: [
        {
          text: '取消',
          role: 'cancel',
          handler: () => {
            alert.dismiss();
          }
        },
        {
          text: '重试',
          handler: () => {
            alert.dismiss().then(res => this.changeMap(this.mapType));
          }
        }
      ]
    });
    alert.present();
  }

  processHouseData(data) {
    this.totalCount = data.Data.Total;
    this.markerType = data.Data.Type;

    //Start City Markers
    if ((this.markerType == 'city') || (this.markerType == 'grid')) {
      // this._zone.run(() => {
      //   this.isListShow = false;
      //   this.currentDiv = '';
      // });
      for (let p in data.Data.AreaHouseCount) {

        let areaHouse = data.Data.AreaHouseCount[p];
        if (areaHouse.HouseCount > 0) {
          let price = areaHouse.TotalPrice / areaHouse.HouseCount;
          //console.log("Name:" + areaHouse.NameCn + "Lat:" + areaHouse.GeocodeLat + "Count:" + areaHouse.HouseCount + "AvgPrice:" + price);
          this.setContentCount(areaHouse.GeocodeLat, areaHouse.GeocodeLng, areaHouse.HouseCount.toString(), areaHouse.NameCn, price);

        }
      }
    }   //End of City Markers


    if (this.markerType == 'house') {
      this._zone.run(() => {
        this.isListShow = true;
        this.currentDiv = 'listButton';
      });
      let count = 1;
      let houses = [];
      let totalprice = 0;
      let totalhouse = data.Data.MapHouseList.length;
      this.imgHost = data.Data.imgHost;
      let nextLat;
      let nextLng;
      let listAllHtml;
      this.currentHouseList = data.Data.MapHouseList;
      let panelhtml;
      // console.log("Current House List Length:" + this.currentHouseList.length);

      // console.log('Image Host:' + this.imgHost);
      for (let index = 0, l = totalhouse; index < l; index++) {
        let house = data.Data.MapHouseList[index];


        if (index < (totalhouse - 1)) {
          nextLat = data.Data.MapHouseList[index + 1].GeocodeLat;
          nextLng = data.Data.MapHouseList[index + 1].GeocodeLng;

        }
        //console.log("Current:" + this.GeocodeLng + "Next:" + nextLng + "Total:" + totalhouse + "index:" + index + "Count:" + count);
        let imgurl = this.imgHost + house.CoverImg;
        let imgurltn = this.imgHost + house.CoverImgtn;
        let hprice = (house.SaleLease == 'Lease') ? Math.round(house.Price) * 10000 + '加元/月' : Math.round(house.Price) + '万加元';
        let markerprice = Math.round(house.Price);

        let tlat = parseFloat(house.GeocodeLat);
        let tlng = parseFloat(house.GeocodeLng);


        let li = ' <ion-card>'
          + '<img src="' + this.imgHost + house.CoverImg + '" />'
          + '<div class="house_desc" text-left text-nowrap>'
          // + '<ion-item padding-left>'
          + '<ion-badge item-left>MLS:' + house.MLS + '</ion-badge>'
          + '  <ion-badge item-right><i class="fa fa-usd" aria-hidden="true"></i>' + house.Price + '万</ion-badge>'
          // + '   </ion-item>'

          + '    <div class="card-subtitle" text-left>'
          + '     <div><i padding-right secondary class="fa fa-building" aria-hidden="true"></i><span padding-right>' + house.HouseType + '</span>' + house.Beds + '卧' + house.Baths + '卫' + house.Kitchen + '厨</div>'
          + '     <div><i padding-right secondary class="fa fa-location-arrow" aria-hidden="true"></i><span padding-right>' + house.Address + '</span>' + house.MunicipalityName + '</div>'
          + '     </div></div>'
          + ' </ion-card> '

        if ((nextLng != house.GeocodeLng) || (nextLat != house.GeocodeLat)) {

          if (count == 1) {


            houses.push(house);
            //this.setContent(tlat, tlng, 1, houses, markerprice);
            this.setContent(tlat, tlng, 1, li, house, markerprice, house.MLS);
            houses = [];
            totalprice = 0;
            panelhtml = '';
          } else {
            //generate panel list view

            houses.push(house);
            panelhtml = panelhtml + li;
            let price = (totalprice + markerprice) / count;
            //this.setContent(tlat, tlng, count, houses, price);
            // this.setContent(tlat, tlng, count, panelhtml, price, house.MLS);
            this.setContent(tlat, tlng, count, panelhtml, houses, price, house.MLS);
            count = 1;
            totalprice = 0;
            houses = [];
            panelhtml = '';

          }


        }
        else {
          ++count;
          totalprice = totalprice + markerprice;
          houses.push(house);
          panelhtml = panelhtml + li;
        }

      }
    } //End of if HOUSE

  }

  processSchoolData(data) {
    this.markerType = data.type;
    this.currentDiv = '';

    //Start Grid Markers
    if (this.markerType == 'grid') {

      for (let p in data.gridList) {
        let school = data.gridList[p];
        let schoolcount = school.SchoolCount;
        if (schoolcount > 0) {
          let avgrating = Math.round(school.TotalRating * 10 / schoolcount) / 10;
          //console.log( "Name:" + school.GeocodeLat + "Lat:" + school.GeocodeLng + "Count:"+ school.SchoolCount + "TotalRating:" + school.TotalRating + "AvgRating:" + avgrating);
          this.setContentCount(school.GeocodeLat, school.GeocodeLng, school.SchoolCount, school.GridName, avgrating);

        }
      }
    } //End of City Markers
    this.schoolList = data.SchoolList;
    if ((this.markerType == 'school') && (this.schoolList.length > 0)) {


      for (let p in data.SchoolList) {
        let school = data.SchoolList[p];
        var name = school.School;
        var rank = school.Paiming;
        var rating = school.Pingfen;
        var tlat = parseFloat(school.Lat);
        var tlng = parseFloat(school.Lng);

        //Generate single house popup view
        var html = "<p text-left>名称：" + name + "</p>"
          + "<p text-left>年级：" + school.Grade + "</p>"
          + "<p text-left>地址：" + school.Address + "</p>"
          + "<p text-left>城市：" + school.City + " " + school.Province + " " + school.Zip + "</p>"
          + "<p text-left>排名：<ion-badge>" + rank + "</ion-badge> 评分：<ion-badge>" + rating + "</ion-badge></p>";

        this.setSchoolContent(tlat, tlng, html, rating);

      }
    } //End of if HOUSE

  }

  //End of MAP import function

}

