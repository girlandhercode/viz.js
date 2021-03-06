  function Viz(src) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    var format = options.format === undefined ? "svg" : options.format;
    var engine = options.engine === undefined ? "dot" : options.engine;
    var scale = options.scale;
  
    if (format == "png-image-element") {
      return Viz.svgXmlToPngImageElement(render(src, "svg", engine), scale);
    } else {
      return render(src, format, engine);
    }
  }
  
  function render(src, format, engine) {
    var graphviz = Module();
    
    var resultPointer = graphviz["ccall"]("vizRenderFromString", "number", ["string", "string", "string"], [src, format, engine]);
    var resultString = graphviz["Pointer_stringify"](resultPointer);

    var errorMessagePointer = graphviz["ccall"]("vizLastErrorMessage", "number", [], []);
    var errorMessageString = graphviz["Pointer_stringify"](errorMessagePointer);
    
    if (errorMessageString != "") {
      throw errorMessageString;
    }
    
    return resultString;
  }
  
  Viz.svgXmlToPngImageElement = function(svgXml, scale, callback) {
    if (scale === undefined) {
      if ("devicePixelRatio" in window && window.devicePixelRatio > 1) {
        scale = window.devicePixelRatio;
      } else {
        scale = 1;
      }
    }
    
    var pngImage = new Image();
    
    if (typeof fabric === "object" && fabric.loadSVGFromString) {
      try {
        fabric.loadSVGFromString(svgXml, function(objects, options) {
          // If there's something wrong with the SVG, Fabric may return an empty array of objects. Graphviz appears to give us at least one <g> element back even given an empty graph, so we will assume an error in this case.
          if (objects.length == 0) {
            if (callback !== undefined) {
              callback("Error loading SVG with Fabric");
              return;
            } else {
              throw "Error loading SVG with Fabric";
            }
          }
        
          var element = document.createElement("canvas");
          element.width = options.width;
          element.height = options.height;
      
          var canvas = new fabric.Canvas(element, { enableRetinaScaling: false });
          var obj = fabric.util.groupSVGElements(objects, options);
          canvas.add(obj).renderAll();
      
          pngImage.src = canvas.toDataURL({ multiplier: scale });
          pngImage.width = options.width;
          pngImage.height = options.height;
        
          if (callback !== undefined) {
            callback(null, pngImage);
          }
        });
      } catch (e) {
        if (callback !== undefined) {
          callback(e);
        } else {
          throw e;
        }
      }
    } else {
      var svgImage = new Image();

      svgImage.onload = function() {
        var canvas = document.createElement("canvas");
        canvas.width = svgImage.width * scale;
        canvas.height = svgImage.height * scale;

        var context = canvas.getContext("2d");
        context.drawImage(svgImage, 0, 0, canvas.width, canvas.height);

        pngImage.src = canvas.toDataURL("image/png");
        pngImage.width = svgImage.width;
        pngImage.height = svgImage.height;
        
        if (callback !== undefined) {
          callback(null, pngImage);
        }
      }
      
      svgImage.onerror = function(e) {
        if (callback !== undefined) {
          callback(e);
        }
      }
      
      svgImage.src = "data:image/svg+xml;base64," + btoa(svgXml);
    }
    
    if (callback === undefined) {
      return pngImage;
    }
  }
  
  Viz.svgXmlToPngBase64 = function(svgXml, scale, callback) {
    Viz.svgXmlToPngImageElement(svgXml, scale, function(err, image) {
      if (err) {
        callback(err);
      } else {
        callback(null, image.src.slice("data:image/png;base64,".length));
      }
    });
  }
  
  if (typeof module === "object" && module.exports) {
    module.exports = Viz;
  } else {
    global.Viz = Viz;
  }
  
})(this);
