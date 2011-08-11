// Tests for sorted_range_list.js

module("sorted_range_list insertion tests");

function compareSortedRangeLists(list1, list2) {
  var ranges1 = list1.ranges();
  var ranges2 = list2.ranges();
  if (ranges1.length != ranges2.length) return false;
  
  for (var i = 0; i < ranges1.length; i++) {
    var range1 = ranges1[i];
    var range2 = ranges2[i];
    if (range1.begin != range2.begin || range1.end != range2.end) return false;
  }

  return true;
}


test("Basic Add",function(){
  var sorted_range_list = new SortedRangeList();
  sorted_range_list.add(new Range(1, 2));
  sorted_range_list.add(new Range(4, 5));

  var ranges = sorted_range_list.ranges();
  equals(ranges.length, 2, "Length is correct");
  ok(compareSortedRangeLists(sorted_range_list,
                             new SortedRangeList([new Range(1, 2),
                                                  new Range(4, 5)])),
     "Data is valid.");
})

test("Basic Overlap",function(){
  var sorted_range_list = new SortedRangeList();
  sorted_range_list.add(new Range(1, 4));
  sorted_range_list.add(new Range(3, 5));

  equals(sorted_range_list.ranges().length, 1, "Length is correct");
  ok(compareSortedRangeLists(sorted_range_list,
                             new SortedRangeList([new Range(1, 5)])),
     "Data is valid.");
})

test("Insert Overlap",function(){
  var sorted_range_list = new SortedRangeList();
  sorted_range_list.add(new Range(1, 3));
  sorted_range_list.add(new Range(10, 12));
  sorted_range_list.add(new Range(18, 20));

  sorted_range_list.add(new Range(9, 15));

  equals(sorted_range_list.ranges().length, 3, "Length is correct");
  ok(compareSortedRangeLists(sorted_range_list,
                             new SortedRangeList([new Range(1, 3),
                                                  new Range(9, 15),
                                                  new Range(18, 20)])),
     "Data is valid.");
})

test("Triple Overlap, no extend",function(){
  var sorted_range_list = new SortedRangeList();
  sorted_range_list.add(new Range(1, 3));
  sorted_range_list.add(new Range(5, 7));
  sorted_range_list.add(new Range(20, 22));
  sorted_range_list.add(new Range(2, 21));

  equals(sorted_range_list.ranges().length, 1, "Length is correct");
  ok(compareSortedRangeLists(sorted_range_list,
                             new SortedRangeList([new Range(1, 22)])),
     "Data is valid.");
})

test("Triple Overlap, left extend",function(){
  var sorted_range_list = new SortedRangeList();
  sorted_range_list.add(new Range(2, 3));
  sorted_range_list.add(new Range(5, 7));
  sorted_range_list.add(new Range(20, 22));
  sorted_range_list.add(new Range(1, 21));

  equals(sorted_range_list.ranges().length, 1, "Length is correct");
  ok(compareSortedRangeLists(sorted_range_list,
                             new SortedRangeList([new Range(1, 22)])),
     "Data is valid.");
})

test("Triple Overlap, right extend",function(){
  var sorted_range_list = new SortedRangeList();
  sorted_range_list.add(new Range(1, 3));
  sorted_range_list.add(new Range(5, 7));
  sorted_range_list.add(new Range(20, 22));
  sorted_range_list.add(new Range(1, 25));

  equals(sorted_range_list.ranges().length, 1, "Length is correct");
  ok(compareSortedRangeLists(sorted_range_list,
                             new SortedRangeList([new Range(1, 25)])),
     "Data is valid.");
})

test("Triple Overlap, double extend",function(){
  var sorted_range_list = new SortedRangeList();
  sorted_range_list.add(new Range(2, 3));
  sorted_range_list.add(new Range(5, 7));
  sorted_range_list.add(new Range(20, 22));
  sorted_range_list.add(new Range(1, 25));

  equals(sorted_range_list.ranges().length, 1, "Length is correct");
  ok(compareSortedRangeLists(sorted_range_list,
                             new SortedRangeList([new Range(1, 25)])),
     "Data is valid.");
})

test("Basic no-op",function(){
  var sorted_range_list = new SortedRangeList();
  sorted_range_list.add(new Range(1, 42));
  sorted_range_list.add(new Range(1, 42));

  equals(sorted_range_list.ranges().length, 1, "Length is correct");
  ok(compareSortedRangeLists(sorted_range_list,
                             new SortedRangeList([new Range(1, 42)])),
     "Data is valid.");
})

test("Insert no-op",function(){
  var sorted_range_list = new SortedRangeList();
  sorted_range_list.add(new Range(-20, -10));
  sorted_range_list.add(new Range(20, 30));
  sorted_range_list.add(new Range(40, 50));

  sorted_range_list.add(new Range(20, 30));

  equals(sorted_range_list.ranges().length, 3, "Length is correct");
  ok(compareSortedRangeLists(sorted_range_list,
                             new SortedRangeList([new Range(-20, -10),
                                                  new Range(20, 30),
                                                  new Range(40, 50)])),
     "Data is valid.");
})


test("Subsume no-op",function(){
  var sorted_range_list = new SortedRangeList();
  sorted_range_list.add(new Range(-20, -10));
  sorted_range_list.add(new Range(20, 30));
  sorted_range_list.add(new Range(40, 50));

  sorted_range_list.add(new Range(25, 27));

  equals(sorted_range_list.ranges().length, 3, "Length is correct");
  ok(compareSortedRangeLists(sorted_range_list,
                             new SortedRangeList([new Range(-20, -10),
                                                  new Range(20, 30),
                                                  new Range(40, 50)])),
     "Data is valid.");
})

test("Insert clean",function(){
  var sorted_range_list = new SortedRangeList();
  sorted_range_list.add(new Range(-20, -10));
  sorted_range_list.add(new Range(20, 30));
  sorted_range_list.add(new Range(40, 50));

  sorted_range_list.add(new Range(32, 37));

  equals(sorted_range_list.ranges().length, 4, "Length is correct");
  ok(compareSortedRangeLists(sorted_range_list,
                             new SortedRangeList([new Range(-20, -10),
                                                  new Range(20, 30),
                                                  new Range(32, 37),
                                                  new Range(40, 50)])),
     "Data is valid.");
})

test("Insert adjoining",function(){
  var sorted_range_list = new SortedRangeList();
  sorted_range_list.add(new Range(-20, -10));
  sorted_range_list.add(new Range(20, 30));
  sorted_range_list.add(new Range(40, 50));

  sorted_range_list.add(new Range(30, 35));

  equals(sorted_range_list.ranges().length, 3, "Length is correct");
  ok(compareSortedRangeLists(sorted_range_list,
                             new SortedRangeList([new Range(-20, -10),
                                                  new Range(20, 35),
                                                  new Range(40, 50)])),
     "Data is valid.");
})

module("sorted_range_list intersection tests");


test("Intersects",function(){
  var sorted_range_list = new SortedRangeList();
  sorted_range_list.add(new Range(1, 5));
  sorted_range_list.add(new Range(10, 15));

  ok(sorted_range_list.intersects(new Range(0, 2)), "Left partial intersect.");
  ok(sorted_range_list.intersects(new Range(4, 9)), "Right partial intersect.");
  ok(sorted_range_list.intersects(new Range(-3, 8)), "Overlap intersect.");
  ok(sorted_range_list.intersects(new Range(2, 3)), "Subset intersect.");
  ok(sorted_range_list.intersects(new Range(5,7)), "Adjoining intersection.");

  ok(!sorted_range_list.intersects(new Range(-42, -9)), "No intersect left.");
  ok(!sorted_range_list.intersects(new Range(7, 9)), "No intersect middle.");
  ok(!sorted_range_list.intersects(new Range(42, 49)), "No intersect right.");
})

