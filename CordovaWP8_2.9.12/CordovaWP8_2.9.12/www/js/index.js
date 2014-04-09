//Load venues or redirect
jQuery(document).ready(function(){

      if (!localStorage.authorization||!localStorage.color||!localStorage.gangster||!localStorage.gang) {
        window.location.replace("splash.html");
      } else {
	    var color = localStorage.color;
		var gangster = localStorage.gangster;
		var locationLatitude = localStorage.latitude; //gangster location
		var locationLongitude = localStorage.longitude;
		
		localStorage.removeItem('venueid');
		mixpanel.register({gang: color, gangster: gangster}); //Track for the droplet click is in index.html
		mixpanel.track("PageLaunch", {page:"index"});
		mixpanel.track("SprayingInitiated", {latitude: locationLatitude, longitude: locationLongitude});
		
		//Change color background depending on player's color
         $('body').removeClass().addClass(color);

        //Menu
        //new gnMenu( document.getElementById( 'gn-menu' ) );

		

        //Check GPS
        watchGPS();
		//$('#to-left', '#to-right').on

        //Get Venues
        var authorization=localStorage.authorization;
        var endpoint = "http://vm0063.virtues.fi/venues/";
        $.ajax({
          type: "GET",
          url: endpoint,
		  async: true, 
          dataType: 'json',
          beforeSend: function (xhr) {
            xhr.setRequestHeader ("Authorization", authorization);
          }
        }).done(function( data ) {
			
			var venueArr = distanceSort(data);
			updateVenueslider(data, venueArr);
			
			/*$.ajaxSetup({ cache: false }); //for IE 
		    setInterval(function() {          //REFRESH UNDER WORK
			$(".liquid-slider").toggleClass(" liquid-slider");
            $('#main-slider').liquidSlider('refresh');
			}
			,10000); */
				
          // Venue slider
          $('#main-slider').liquidSlider({
              hashLinking:false,
              crossLinks:true,
              includeTitle:true,
              mobileNavigation:false,
              firstPanelToLoad:1, // TEE TÄSTÄ LÄHIN
              autoHeight:false,
              minHeight: 0,
              swipe: true,
              hideArrowsWhenMobile: true,
              dynamicArrows: false,
              slideEaseFunction:'easeInOutCubic',
              slideEaseDuration:400,
              heightEaseDuration:800

            // animateIn:"slideInLeft",
            // animateOut:"slideOutLeft"
          });

          jQuery("h1.location").fitText(1.25, { minFontSize: '16px', maxFontSize: '60px' })
          // jQuery(".category").fitText(1, { minFontSize: '10px', maxFontSize: '60px' })
          jQuery("h3.title").fitText(3, { minFontSize: '9px', maxFontSize: '30px' })

        }).fail(function( jqXHR, textStatus ) {
        //TODO fix this
          alert("Error: something went wrong while loading the venues");
        });
		
		
		//Counting the distances between player and location, called from distanceSort()
function locationCheck(data,key,locationLat, locationLon, venueLat, venueLon){
         
         // Compute spherical coordinates
           var rho = 6378.16; // earth ray in meters
           // convert latitude and longitude to spherical coordinates in radians, phi = 90 - latitude
           var phi_1 = (90.0 - locationLat)*Math.PI/180.0;
           var phi_2 = (90.0 - venueLat)*Math.PI/180.0;
         // theta = longitude
           var theta_1 = locationLon*Math.PI/180.0;
           var theta_2 = venueLon*Math.PI/180.0;
            // compute spherical distance from spherical coordinates
            // arc length = \arccos(\sin\phi\sin\phi'\cos(\theta-\theta') + \cos\phi\cos\phi')
           // distance = rho times arc length
           var distance = rho*Math.acos( Math.sin(phi_1)*Math.sin(phi_2)*Math.cos(theta_1 - theta_2) + Math.cos(phi_1)*Math.cos(phi_2) );
		   for (var i = data.length - 1; i >= 0; i--) {
           data[key].distance = distance; // adds distance to venue data, for sorting
			}
         }	

		 //Updating the slider content
function updateVenueslider (data,arraySorted){

		    for (var i = data.length - 1; i >= 0; i--) { 

			var j = arraySorted[i][0]; //[i][0] supposed to be the venue's location in data from the sorted array... 

            var venue = $("<div>").toggleClass( 'venue' );
            var owner = $("<p>").addClass("owner");
			
			var venueId = data[j].id;	
			var locator = "#";
			locator += venueId; //Creates an individual 'id's based on venue id for the droplet icons 
			
            var gang = data[j].gang;
            if (gang != null) {
              // owner.append("Tagged by ");
              $("<span>").addClass(gang+"-owns").text(gang).appendTo(owner);
              owner.appendTo(venue);
            } else {
              owner.append("Untagged").appendTo(venue);
            }
			
            $("<div>").addClass("category").addClass(getCategoryClass(data[j].category)).appendTo(venue);
            $("<h3>").addClass("title").text(getCategory(data[j].category)).appendTo(venue);
			$("<h1>").addClass("location").text(data[j].name).appendTo(venue);
			
			var distance = data[j].distance;
			var distance2 = distance*1000;                // TEMP. Shows the distance from the venue For testing
			var distance3 = distance2.toFixed(0); 
			$("<p>").text(""+distance3+"m").appendTo(venue); 
			$("<br>").appendTo(venue); //TEMP. SOLUTION
			
			if (distance <=0.500) {	//TEMP. DISTANCES ARE WIDE FOR TESTING... NARROW DOWN AT SOME POINT	
			$("<div>").attr('id','#start-to-spray').append("<a id="+venueId+" class='spray icon-droplet'  href='spraying.html'></a>").appendTo(venue);
			
			$('body').on("click",locator, function() {
				localStorage.setItem('venueid',JSON.stringify(this.id)); //Sends individual droplet icon id to spraying page	
				});	
			}else if (distance >0.500&& distance<=1.000){
		
			$("<div>").attr('id','#maybe-to-spray').append("<a class='maybespray icon-droplet'</a>").appendTo(venue); //blinking droplet
			}else{ 
		
			$("<div>").attr('id','#not-to-spray').append("<a class='notspray icon-droplet'></a>").appendTo(venue);//inactive droplet 
			}
			$("<br>").appendTo(venue);
			
            $('#main-slider').append(venue);
			
          };
		 } //Updating the slider content function ends	 
		 
		 //Distance Check and Array from distance sorting
function distanceSort (data){
            locationLatitude = localStorage.latitude; //gangster location needs to be rechecked
		    locationLongitude = localStorage.longitude;

            for (var i = data.length - 1; i >= 0; i--) { //Distance checks from venues
			var venueLatitude = data[i].latitude;
		    var venueLongitude = data[i].longitude;
		    var distance = locationCheck(data,i,locationLatitude,locationLongitude,venueLatitude,venueLongitude); 
		    }
			
			//venueArr =new Array();venueArr.length = 0;
			
			var venueArr =new Array(data.length - 1);
			for (var j = data.length - 1; j >= 0; j--) { // Array, from venue location in data and distance for sorting
			var venueSort = [j,data[j].distance];
			venueArr.push(venueSort);
			}
			venueArr.sort(function(a,b) { //Sorts order of the venues by distance
		    return b[1] - a[1];
		    }); 
			
            return venueArr;			
			
		} //Distance and sorting out
			
		 
    }
window.alert = function(){return null;}; //Javascript popups disabled, atleast for now
});
