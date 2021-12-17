function perc2color(perc) {
	var r, g, b = 0;
	if(perc < 50) {
		r = 255;
		g = Math.round(5.1 * perc);
	}
	else {
		g = 255;
		r = Math.round(510 - 5.10 * perc);
	}
	var h = r * 0x10000 + g * 0x100 + b * 0x1;
	return '#' + ('000000' + h.toString(16)).slice(-6);
}

$("input[type='radio']").click(function(){
	var radioValue = $("input[name='politics']:checked").val();
	if(radioValue){
		$("#sliderstuff").css("visibility", "visible");
		if (radioValue == "conservative") {
			$("#leftlabel").text("More")
			$("#rightlabel").text("Less")
		} else if (radioValue == "liberal") {
			$("#leftlabel").text("Less")
			$("#rightlabel").text("More")
		}
		$("#affiliationRadio").css("visibility", "hidden");
	}
});

$('#regulation').on('input', function(){
	var regulationAmmt = $('#regulation').val();
	var color = perc2color(regulationAmmt);
	
	if (regulationAmmt < 50) {
		$('#goodOrBad').text("Policy Bad");
	} else {
		$('#goodOrBad').text("Policy Good");
	}
	
	$('body').css("background-color", color);
});