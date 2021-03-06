
let label2texts = {};

function addPlus(val) {
	if (val < 0) { return val; }
	else { return "+" + val; }
}

function getCorrStr(corrData) {
    return addPlus(corrData["r"]) + "<br /><span class=\"confint\">[" +
	addPlus(corrData["rl"]) + ", " + addPlus(corrData["ru"]) + "]</span>";
}

function appendHeader(table, explFeat, pol) {    
    let thead = $("<thead>", { class: getPolarity(explFeat, pol) }).appendTo(table);
    let numbHeader = "<th width=\"12%\"></th>";
    let featHeader = "<th width=\"62%\">";
    featHeader += "<span class=\""+getPolarity(explFeat, "posi")+"\">";
    featHeader += explFeat + "</span> と";
    featHeader += (pol == "posi") ? "正" : "負";
    featHeader += "の相関があった回答</th>";
    let corHeader = "<th width=\"26%\">";
    corHeader += "相関係数<br /><span class=\"confint\">95%信頼区間</span></th>";
    $("<tr>").appendTo(thead).append(numbHeader + featHeader + corHeader);
}

function getPolarity(explFeat, pol) {
    let context = (pol == "posi") ? 1 : -1;
    let expl = 1;
    if (explFeat.indexOf("（悪かったこと）") > 0 ||
	explFeat.indexOf("特にない") >= 0 ||
	explFeat.indexOf("（オンデマンド授業の欠点）") > 0 ||
	explFeat.indexOf("特になし") >= 0)
    {
	expl = -1;
    }
    if (expl * context > 0) {
	return "posi";
    } else {
	return "nega";
    }
}

function createTable(parent, data, explFeat, pol, i) {
    let table = $("<table>").appendTo(parent);
    let enqTarget = $(parent).parents(".enq-target").attr("id");
    appendHeader(table, explFeat, pol);
    let tbody = $("<tbody>").appendTo(table);
    let j = 1;
    for (let feat in data) {
	//console.log(feat);
	let number = i + "." + j + ((pol == "posi") ? "+" : "-");
	let tr = $("<tr title>").appendTo(tbody);
	tr.append("<td>"+number+"</td>");
	tr.append("<td class=\"feat\" data-label=\"" + feat + "\">" + feat + "</td>");
	tr.append("<td>" + getCorrStr(data[feat]) + "</td>");
	tr.attr("data-number", number);
	j++;
    }
    let label = $(parent).attr("data-label");
    //console.log(label);
    if (label2texts[label] == null) {
	let textJson = "./js/" + enqTarget + "-" + explFeat + "-" + pol + ".json";
	//console.log(textJson);
	$.getJSON(textJson, function (data) {
	    label2texts[label] = data;
	    //console.log("data: "+JSON.stringify(data));
	    table.find("tbody tr").each(function (index, elm) {
		let feat = $(elm).find("td.feat").attr("data-label");
		// console.log(elm)
		setTooltip(elm, data[feat], feat);
	    });
	}.bind(table));
    }
}


function setTooltip(elm, data, feat) {
    let number = $(elm).attr("data-number");
    let head = "<div class=\"tooltip-head\">"+number+" <strong>"+feat+"</strong>に対応する自由記述</div>";
    let text = "";
    if (data.length == 0) {
	text = "<hr /><div class=\"reldesc\">（対応する自由記述はありません）</span>";
    } else {
	//console.log("!!!! data: "+JSON.stringify(data));
	for (let i in data) {
	    text += "<hr />";
	    text += data[i]["text"];
	}
	text = head + "<div class=\"reldesc\">" + text + "</span>";	
    }
    $(elm).tooltip({
	content: function () {
	    return text;
	},
	open: function() {
	    $(elm).addClass("showingTooltip");
	}.bind(elm)
    });
    $(elm).on("click", function(e) {
	$(elm).tooltip();
	$(elm).addClass("showingTooltip");
    }.bind(elm)).on("mouseout", function(e) {
        e.stopImmediatePropagation();
    }).on("mouseleave", function(e) {
        e.stopImmediatePropagation();
    }).on("tooltipopen", function(e) {
	$("tr.showingTooltip").not($(elm)).tooltip("close");
	$("div.ui-tooltip").on("mouseleave", function(e) {
	    $("tr.showingTooltip").tooltip("close");
	    $("tr.showingTooltip").removeClass("showingTooltip");
	});
    }.bind(elm));
    //$("div.feat-table").on("click", function(e) {
    $("table").on("click", function(e) {
        e.stopImmediatePropagation();
    });
    $("div.container").on("click", function(e) {
	$(elm).tooltip("close");
	$(elm).removeClass("showingTooltip");
    }.bind(elm));
}

function creatPieChart(canvas, data) {
	if (data != null) {
		let ctx = canvas.getContext('2d');

		var chart = new Chart(ctx, {
			type: 'pie',
			data: {
				datasets: [{
					backgroundColor: [
						"#f4d002",
						"#80c686",
						"#ffff51",
						"#005193",
						"#002a65"
					],
					data: data["data"]
				}],
				labels: data["labels"]
			},
			options: {
				responsive: true,
			}
		});

	}
}

function read(target, d) {
    let json_file = "js/"+target+".json";
    $.getJSON(json_file, function (data) {
	//console.log(data);
	let i = $("div.toc").attr("data-i");
	for (let explFeat in data) {
	    console.log(explFeat);
	    $("#"+target).append("<a name=\""+i+"\" />");
	    $("#"+target).append("<h4>" + i + ". " + explFeat + "</h4>");
	    $("ul#"+target+"-list").append("<li><a href=\"#"+i+"\">"+i+". " + explFeat + "</a></li>");
	    let pieCanvas = $('<canvas></canvas>');
	    $("#"+target).append(pieCanvas);
	    creatPieChart(pieCanvas[0], data[explFeat]["freq"]);
	    
	    let explDiv = $("<div>", {
		class: "expl"
	    }).appendTo("#"+target);
	    let posiDiv = $("<div>", {
		class: "feat-table"
	    }).appendTo(explDiv);
	    posiDiv.attr("data-label", explFeat + "-posi");
	    let negaDiv = $("<div>", {
		class: "feat-table"
	    }).appendTo(explDiv);
	    negaDiv.attr("data-label", explFeat + "-nega");
	    let posi = data[explFeat]["posi"];
	    createTable(posiDiv, posi, explFeat, "posi", i);
	    let nega = data[explFeat]["nega"];
	    createTable(negaDiv, nega, explFeat, "nega", i);
	    i++;
	    $("div.toc").attr("data-i", i);
	}
	if (d) {
	    d.resolve();
	}
    });
}

$(function () {
    $("div.toc").attr("data-i", 1);
    let d = new $.Deferred();
    read("student", d);
    d.promise().then(function() {
	read("teacher");
    });

});
