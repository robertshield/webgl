
Range = function(begin, end) {
  this.begin = begin;
  this.end = end;
}

SortedRangeList = function(range_list) {
  this.ranges_ = range_list || [];
};

SortedRangeList.prototype = {
  ranges : function() {
    return this.ranges_;
  },

  add : function(range) {
    if (this.ranges_.length == 0) {
      this.ranges_.push(range);
      return;
    }
    
    // First find the range to insert before or into. 
    var i = 0;
    while (i < this.ranges_.length - 1 &&
           range.begin > this.ranges_[i].end ) {
      i++;
    }
    
    if (range.end < this.ranges_[i].begin) {
      // Can insert before the first found range.
      this.ranges_.splice(i, 0, range);
      return;
    }

    // Find the last range to insert into or after.
    var j = this.ranges_.length - 1;
    while (j > 0 && range.end < this.ranges_[j].begin) {
      j--;
    }
    if (range.begin > this.ranges_[j].end){
      // Can insert after the last found range.
      this.ranges_.splice(j + 1, 0, range);
      return;
    }

    // If we get here we have overlap, so we need to merge ranges.
    // Remove all ranges from i to j and replace with a new range from X
    // to Y where:
    // X = min(range.begin, ranges_[i].begin)
    // Y = max(range.end, ranges_[j].end)
    var new_range = new Range(Math.min(range.begin, this.ranges_[i].begin),
                              Math.max(range.end, this.ranges_[j].end));
    this.ranges_.splice(i, j-i+1, new_range);
  },

  // Returns true if |range| intersects with an existing range in the list.
  // Note a range that adjoins an existing range is considered to intersect.
  intersects : function(range) {
    for (var i = 0; i < this.ranges_.length; i++) {
      var intersecting_range = new Range(
          Math.max(this.ranges_[i].begin, range.begin),
          Math.min(this.ranges_[i].end, range.end));
      if (intersecting_range.end >= intersecting_range.begin) return true;
    }

    return false;
  }
};

