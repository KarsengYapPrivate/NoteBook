let game_name = {
	"default" : "Songkran",
	"en" : "Songkran"
}

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';

  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

if(getParameterByName('lang') != null){
	if(game_name[getParameterByName('lang')] != null){
		window.document.title = game_name[getParameterByName('lang')];
	}else{
		window.document.title = game_name.default;
	}
}else{
	//Default Language
	window.document.title = game_name.default;
}