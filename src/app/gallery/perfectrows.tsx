
$.fn.perfectLayout = function(photos) {
    const node = this;
    // Get the scrollbar width
      var scrollDiv = document.createElement("div");
      scrollDiv.className = "scrollbar-measure";
      document.body.appendChild(scrollDiv);
      var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
      document.body.removeChild(scrollDiv);
    
    const perfectRows = perfectLayout(photos, $(this).width(), $(window).height(), {margin: 2});
    node.empty();
  
    perfectRows.forEach(function (row) {
      row.forEach(function (img) {
        var imgNode = $('<div class="image"></div>');
        imgNode.css({
          'width': img.width + 'px',
          'height': img.height + 'px',
          'background': 'url(' + img.src + ')',
          'background-size': 'cover'
        });
        node.append(imgNode);
      });
    });
  };
  
  $(document).ready(function() {
    var gallery = $('#gallery');
  
    gallery.perfectLayout(photos);
  
    $(window).resize(function() {
      gallery.perfectLayout(photos);
    });
    $(window).trigger('resize');
  });
  